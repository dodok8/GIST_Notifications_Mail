import axios from 'axios';
import cheerio from 'cheerio';
// https://stackoverflow.com/questions/64021077/default-export-not-explicitly-defined
// 타입 정의 패키지(@types/nodemailer)가 default export가 없이 타입만 정의되어 있어서 no default export 가 뜨는데  컴파일 옵션을 주거나 네임 스페이스를 쓰는 식으로 해결할 수 있다.
import nodemailer from 'nodemailer';

const endpoint =
  'https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/list.do';

const getArticleEndpoint = function (
  link: RegExpMatchArray | null | undefined
) {
  if (link) {
    return `https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/view.do?nttId=${link[0]}`;
  } else {
    return '';
  }
};

class NoNoticeException extends Error {
  constructor() {
    super('Nothing to Send');
    this.name = 'Nothing to Send';
  }
}

const ID = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const getHTML = async () => {
  try {
    return axios.get(endpoint);
  } catch (error) {
    console.error(error);
  }
};

const getArticles = async (now: Date) => {
  try {
    const data = (await getHTML())?.data;

    let articles: Array<{
      fixed: boolean;
      title: string;
      link: RegExpMatchArray | null | undefined;
      date: Date;
    }> = [];
    const $ = cheerio.load(data);
    const $bodyList = $('#txt > div > div.no-more-tables > table > tbody > tr');
    $bodyList.each(function () {
      articles.push({
        fixed: $(this).find('td:nth-child(1)').text() === '공지' ? true : false,
        title: $(this).find('td.subject > a').text(),
        link: $(this)
          .find('td.subject > a')
          .attr('onclick')
          ?.match(/([A-Z])\w+/),
        date: new Date(Date.parse($(this).find('td:nth-child(5)').text())),
      });
    });

    const result = articles
      .filter((article) => {
        return (+now - +article.date) / (1000 * 60 * 60 * 24) < 3;
        //date를 산술연산에 하기 위해 +를 붙여서 바꿔줌
      })
      .filter((article) => !article.fixed);

    return result;
  } catch (e) {
    console.error(e);
  }
};

async function sendEmail() {
  console.log('Start');
  const now = new Date();
  const header = `${now.getMonth() + 1}월 ${now.getDate()}일 GIST 대학 공지`;

  try {
    const articles = await getArticles(now);
    if (articles?.length === 0 || !articles) {
      throw new NoNoticeException();
    } else {
      const bodyList = `<ul>
      ${articles
        .map((article) => {
          const tags = `<li><a href="${getArticleEndpoint(article.link)}">${
            article.title
          } ${article.date.toISOString().substring(0, 10)}</a></li>`;
          return tags;
        })
        .reduce((accumulator, currentValue) => accumulator + currentValue)}
      </ul>`;

      const mailBody = `<h1><a href="${endpoint}">${header}</a></h1>
      ${bodyList}
      `;

      const transporter = nodemailer.createTransport({
        service: 'Outlook365',
        auth: {
          user: ID,
          pass: PASSWORD,
        },
      });

      const mailOption = {
        from: ID,
        to: ID,
        subject: header,
        html: mailBody,
      };

      await transporter.sendMail(mailOption);
      console.log('Complete Mail Sending');
    }
  } catch (error) {
    // instanceof는 타겟이 es5이하 버전이면 오류가 난다. 그래서 프로토타입을 직접 지정해줘야 한다.
    // https://www.dannyguo.com/blog/how-to-fix-instanceof-not-working-for-custom-errors-in-typescript/
    // target을 es6로 하면 경로 관련 오류가 터져나오는데, 이는 "moduleResolution": "node" 로 하면 해결
    if (error instanceof NoNoticeException) {
      console.log('Nothing to Send');
    } else {
      console.error(error);
    }
  }
}

sendEmail();
