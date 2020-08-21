const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');

const Posts = require('./model/post');
const router = require('./fileUpload');
const sequelize = require('./model/database');
const getData = require('./getData');
const callTranslationApi = require('./callTranslationApi');
const callNaturalLangApi = require('./callNaturalLangApi');
const { convertFormatForAnalysis, convertFormatForUI } = require('./convertFormat');
// const process_sentimentAnalysis = require('./process_sentimentAnalysis')
const { imageToAscii } = require('./imageToAscii');
const dotenv = require('dotenv').config();

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.json()).use(bodyParser.urlencoded({ extended: true }));
app.set('port', process.env.PORT || 5000);
app.use('/', express.static(path.join(__dirname, 'public')));
app.use(router);
const getMbti = require('./pythonRequester');
app.post('/mbti', async (req, res, next) => {
  const mbti = (await getMbti(req.body.post))[0];
  res.json({ data: mbti });
});
app.post('/posts', async (req, res) => {
  const post = {
    title: req.body.title,
    contents: req.body.contents,
  };
  const { objectDetection } = req.body;
  await callTranslationApi(post).then(callNaturalLangApi);
  if (objectDetection) {
    const [boxPoints, filePath] = objectDetection;
    const ascii = await imageToAscii(filePath, boxPoints);
    await Posts.create({ ...post, ascii });
  } else await Posts.create({ ...post });

  res.redirect('/');
});

/*
ex)
processedPost {
  title: '하하하',
  contents: '하하하하 안녕하세요~',
  translatedText: 'Hahahaha Hello~',
  sentiment: 'neutral' // 감정 분석 결과 neutral, positive, negative
}
*/

app.use(router);
app.get('/posts', async (req, res) => {
  const result = await Posts.findAll();
  // TODO DB에서 select 한 데이터를 출력해주는 코드
  res.json(result);
});
// {
//   "postId": "1",
//   "sentiment": "neutral",
//   "title" : "즐거운 하루입니다.",
//   "contents": "안녕하세요. 첫번째 글을 쓰게 되었네요. 커다란 영광입니다. 잘 부탁드립니다.",
//   "ascii" : null
// },

app.listen(app.get('port'), () => {
  console.log(`만리안 app listening at http://localhost:${app.get('port')}`);
});
