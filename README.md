# dictionary-testing

**install dependencies**

first ensure you have Nodejs and npm (or yarn) installed and then install dependencies:

```
npm install
```

**run tests**

for tests to run correctly you need to provide the Authentication token in a AUTHORIZATION_TOKEN environment variable. You can do this by either setting it in the terminal before running the command below or by creating a .env file in the root directory (check out .env.example for a sample).

```
npm test
```

### Architechture

Given the nature and simplicity of these tests, my first instinct was to operate on one dictionary throughout all test cases by storing its ID in a global variable. However, from personal experience, this can quickly become troublesome when tests grow and it can waste a lot of time when debugging failing tests due to conflicting state mutations. Tests should be clear and easy to read otherwise they can add unwarranted complexity to a project.

I could, on the other hand, create a new dictionary for each single test case (each `it(...)` block) but in my personal opinion, this is not necessary and could be expansive in large test files whether in the time it takes to write tests or the amount of API calls. In order to have a balance between complexity and expansiveness, I ended up creating a dictionary for each API method testing block using the beforeAll hook when needed. In this case, there were three "describe" sub-blocks where each one is testing one method as requested by the assessment.

When developing comprehensive and complex tests for each endpoint where tests start slowing down we could always split tests into different suites and take advantage of jests parallel execution but in this scenario, it is not warranted.

In each test block (e.g. `describe(...)`) I wrote three tests testing one method of an endpoint. A common test among these three endpoints is the unauthorized requests check to ensure security. I also tested that the API performs the actions it claims to perform and in some cases confirmed those changes by a subsequent request rather than depending on the returned status code. For instance, when a resource is deleted I then send a subsequent request to confirm that it is actually not available. This way I can confirm the API is behaving the way it is supposed to rather than only trusting the response 204 status code.

I constructed the tests assuming we have no control over the API which means I created only passing tests for the existing implementation of the API to protect against breaking changes in the future. If we had control over the api and the goal was to insure best practices, we can test for symatic API implementions even if tests are failing in order to notify API team and aim to pass those tests. I did add one important failing test but I made it skip with a comment as to why it is failing so that it could be unskipped in the future.

### Observations

- I noticed that CORS were not set in the production API. This is not an issue when running tests in non-browser environment but in order to simulate a browser environment, the server must be able to respond to an OPTIONS request and set the CORS unless the API is always consumed by the same domain or meant for a non-browser environment.

- The response bodies in POST tests did not include a resource access URL's for accessing newly created/modified resources. This is not a requirement but it is the symatic way of constructing Restful APIs.

- When trying to access a deleted resource (dictionary in this case). The response Content-Type header is set to application/json when in fact the server is returning html in the body. This was preventing supertest assertion from proceeding because it was throwing a JSON parsing error. Since I built my test assuming we have no control over API, I was able to get around this issue by using axios and doing some manual assertion.
