const axios = require("axios");
const cheerio = require("cheerio");
const nodemailer = require("nodemailer");

const endpoint = "https://college.gist.ac.kr/prog/bbsArticle/BBSMSTR_000000005587/list.do";
const ID = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;

const getHTML = async () => {
  try {
    return await axios.get(endpoint);
  } catch (error) {
    console.error(error);
  }
};

const getArticles = async (now) => {
  try {
    const html = await getHTML();
    let articles = [];
    const $ = cheerio.load(html.data);
    const $bodyList = $("#txt > div > div.no-more-tables > table > tbody > tr");
    $bodyList.each(function (i) {
      articles[i] = {
        fixed: isNaN($(this).find("td:nth-child(1)").text()),
        title: $(this).find("td.subject > a").text(),
        date: new Date(Date.parse($(this).find("td:nth-child(5)").text())),
      };
    });

    const compareDate = (article) => {
      return (now - article.date) / (1000 * 60 * 60 * 24) < 2;
    };
    const result = Array.from(new Set(articles.filter(compareDate)));
    return result;
  } catch (e) {
    console.error(e);
  }
};

(async function sendEmail() {
  const now = new Date();
  const header = `${now.getMonth() + 1}월 ${now.getDate()}일 GIST 대학 공지`;

  const articles = await getArticles(now);

  if (articles.length === 0) {
    console.log("Nothing to Send");
    return;
  } else {
    console.log(articles);
    const bodyList =
      "<ul>" +
      articles
        .map((article) => {
          const tags = `<li>${article.title} ${article.date.toISOString().substring(0, 10)}</li>`;
          return tags;
        })
        .reduce((accumulator, currentValue) => accumulator + currentValue) +
      "</ul>";
    const mailbody = `<h1><a href="${endpoint}">${header}</a></h1>` + "\n" + bodyList;
    const transporter = nodemailer.createTransport({
      service: "Outlook365",
      auth: {
        user: ID,
        pass: PASSWORD,
      },
    });
    const mailOption = {
      from: ID,
      to: ID,
      subject: header,
      html: mailbody,
    };
    try {
      transporter.sendMail(mailOption);
      console.log("Mail Sending Complete");
    } catch (error) {
      console.error(error);
    }
  }
})();
