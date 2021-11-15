# Node.js 자가진단 모듈

https://github.com/kimcore/hcs.js 여기에 app.js 파일 추가하면 됩니다.(src 폴더와 같이 있는 경로로)


# 사용법
별거 없습니다. 폴더에 넣으시고 
> npm install express
익스프레스를 설치해줍니다.
> node app.js
app.js 를 실행시키고

> localhost:5555/check
> URL 파라미터를 사용합니다.
```
* name 이름
* birth 생년월일
* password 4자리 숫자 비밀번호
* schoolName 학교 orgCode | https://neis.chemistryx.me/ 여기에서 검색한 학교 코드 기
* schoolLevel 학교급 숫자 | 1 유치원 2 초 3 중 4 고 5 특
* index 검색된 학교 index 숫자 | 학교가 여러개 선택될 경우 0~n 으로 선택 가능.
```

> localhost:5555/test
프록시에 정상 연결 되었는지 테스트 하는 용도.
