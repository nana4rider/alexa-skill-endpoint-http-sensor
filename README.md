# alexa-skill-endpoint-http-sensor

Alexa Smart Home Skill HTTP Sensor

# データベース構成の変更
```
npm run miggen -- [name]
npm run migrun
```

# 認可コードからリフレッシュトークンを取得
```bash
curl -i -X POST \
   -H "Content-Type:application/json" \
   -d \
'{
  "grant_type": "authorization_code",
  "code": "",
  "client_id": "",
  "client_secret": ""
}' \
 'https://api.amazon.com/auth/o2/token'
```
