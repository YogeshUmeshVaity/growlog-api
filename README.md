<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo_text.svg" width="320" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

## Description

This is a complete authentication system built from scratch without using the Passport.js library. It uses NestJS, PostgreSQL, TypeORM, SQLite in-memory database for test, Postmark email service, Google OAuth2 API, Bcrypt, JWT and Golevelup NestJS for mocking complex objects.

It implements features such as Sign-up, Login, Login using Google, Change Password, Logout From Other Devices, Recover Password, Sending Emails, Validate Recovery Code, Reset Password, Update Username, Update Email and so on. All with hundred percent test coverage with unit tests and a hundred percent test coverage with e2e tests.

You can see some unique ways to test every component of a NestJS application, including Interceptors, DTOs with complex validations and custom database repositories.

I have also included some advanced mocking techniques for mocking Google OAuth2 APIs.

You will find some great helper functions that make the test code highly readable.

We have different environment variable settings, so we can have different instances of database for production, development and testing.

This project also implements good quality tools like Husky and Commitizen to enforce clean commit practices before pushing the new commits to the main repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
