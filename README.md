# CRUD Board Portfolio - Server-side

[CRUD Board](https://www.simplecrudboard.click)

이 프로젝트는 포트폴리오용 게시판 프로젝트의 서버 사이드를 구현한 프로젝트입니다.
[클라이언트 사이드 프로젝트](https://github.com/Kang-Jh/CRUD-board-client-side-portfolio-KR)와 연동되어 있습니다.

아키텍처는 다음의 링크를 참조하여 구축했습니다.
https://softwareontheroad.com/ideal-nodejs-project-structure/ (영문)

익스프레스와 몽고디비를 이용하여 S3에 글과 이미지를 업로드하는 간단한 CRUD 게시판 서버 사이드 프로젝트입니다.
S3에 업로드 후 유저에게 S3 이미지 링크를 보내는게 아니라 Cloudfront 링크를 보냅니다

로그인 시 유저에게 리프레쉬 토큰을 쿠키 형태로 보내고, 이를 바탕으로 클라이언트의 메모리에 저장되는 액세스 토큰을 발급합니다.

[vendia/serverless-express](https://github.com/vendia/serverless-express)라는 라이브러리를 이용해 프로젝트 전체를 AWS Lambda를 이용해 배포했습니다.

## 디렉토리 구조

- dist - 프로젝트를 빌드할 경우 나오는 결과물들의 집합
- src - 프로젝트 개발에 사용되는 모든 파일들의 집합
  - app.ts - 엔트리 포인트
  - api - router들의 집합
    - browser - 클라이언트 엔드포인트
  - config
  - loaders - 익스프레스와 몽고디비 로더
  - middlewares - 익스프레스 미들웨어 집합
  - services - 비즈니스 로직을 처리하는 클래스들의 집합
  - types - 타입스크립트 타입
  - utils - 프로젝트에 필요한 다양한 함수 및 객체들의 집합

## 기술 스택

- Express.js
- MongoDB (Native Driver) + MongoDB Atlas
- JWT
- AWS S3
- Typescript
- dotenv (시크릿 관리)

## 주의사항

배포 전 [vendia/serverless-express](https://github.com/vendia/serverless-express)와 AWS의 사용법을 익혀야 합니다.

AWS Lambda에 배포할 때 외부 패키지들을(node_modules) 사용할 시 node_modules 폴더를 같이 포함시켜줘야 하므로 npm package-deploy 초기 설정할 때만 쓸모가 있습니다.

람다의 메모리 제한은 160M보다 크게 설정해주세요. 평균 메모리 사용량은 156MB입니다.

이후에는 node_modules와 package.json, .env 파일을 복사해서 배포되는 폴더에 같이 넣고 zip 확장자로 압축하여 업로드해줘야 합니다.

몽고디비와 람다의 최적화는 [여기를](https://docs.atlas.mongodb.com/best-practices-connecting-to-aws-lambda) 참조해주세요.

또한 람다에 S3에 접근할 수 있는 권한을 IAM을 통해 부여해야 합니다.

마지막으로 MongoDB Atlas를 사용하시는 경우 반드시 네트워크 설정에서 모든 IP에서 접속할 수 있게 해줘야 합니다.
