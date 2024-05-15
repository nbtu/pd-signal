const axios = require('axios');
const FormData = require('form-data');
const args = require('minimist')(process.argv.slice(2));

const uid = args.uid;

const formData = new FormData();
formData.append('userId', uid);
formData.append('info', 'media');

const axiosConfig = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    'x-device-info': '{"t":"webPc","v":"1.0","ui":24631221}',
    ...formData.getHeaders() // 获取 FormData 的头信息
  }
};

axios.post('https://api.pandalive.co.kr/v1/member/bj', formData, axiosConfig)
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });

