# GIST 공지 크롤링 및 e-mail 발송

지스트 업무 단일화 이후로 공지 채널이 바뀌어서 이건 이제 더 이상 작동 안합니다.

![Node.js CI](https://github.com/dodok8/GIST_Notifications_Mail/workflows/Node.js%20CI/badge.svg)

학교 공지를 읽어서 목록을 이메일로 보내주는 프로그램입니다. Secrets에 EMAIL과 PASSWORD를 넣어주셔야 정상작동합니다.

```javascript
const transporter = nodemailer.createTransport({
    service: "Outlook365",
    auth: {
        user: ID,
        pass: PASSWORD,
    },
});
```

이 부분에서 service를 바꿔주는 걸로 다른 이메일 서비스도 쉽게 이용할 수 있습니다. [목록](https://nodemailer.com/smtp/well-known/#supported-services) 왠만한 서비스는 다 있으나 별도의 서비스가 필요할 경우 nodemailer의 홈페이지에서 smtp 설정을 하는법을 찾을 수 있습니다.
