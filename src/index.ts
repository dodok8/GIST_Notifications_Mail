import axios from 'axios';
import cheerio from 'cheerio';
// @ts-ignore: Unreachable code error
import nodemailer from 'nodemailer';

const endpoint =
  'https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/list.do';
const getArticleEndpoint = function (link: string) {
  return `https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/view.do?nttId=${link}`;
};
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
      link: string;
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
          .match(/([A-Z])\w+/)[0],
        date: new Date(Date.parse($(this).find('td:nth-child(5)').text())),
      });
    });

    const result = articles
      .filter((article) => {
        return (+now - +article.date) / (1000 * 60 * 60 * 24) > 0;
      })
      .filter((article) => !article.fixed);
    return result;
  } catch (e) {
    console.error(e);
  }
};

async function sendEmail() {
  const now = new Date();
  const header = `${now.getMonth() + 1}월 ${now.getDate()}일 GIST 대학 공지`;

  const articles = await getArticles(now);

  if (articles?.length === 0) {
    console.log('Nothing to Send');
    return;
  } else {
    console.log(articles);
    const bodyList = `<ul>
      ${articles
        .map((article) => {
          const tags = `<li><a href=\"${getArticleEndpoint(article.link)}\">${
            article.title
          } ${article.date.toISOString().substring(0, 10)}</a>?</li>`;
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

    try {
      transporter.sendMail(mailOption);
      console.log('Mail Sending Complete');
    } catch (error) {
      console.error(error);
    }
  }
}

sendEmail();
