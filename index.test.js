require("dotenv").config();

const { address } = require("ip");
const request = require("supertest");
const axios = require("axios");

const baseURL = "https://dictionary.iachieved.it";

const defaultHeaders = {
  Authorization: `Basic ${process.env.AUTHORIZATION_TOKEN}`,
  "Content-Type": "application/json"
};

let dictionaryId;

describe("/dictionary", () => {
  describe("POST /dictionary", () => {
    /* *
     * testing CORS is neccessary if we are trying to simulate
     * a browsers enviromnet. this test is skipped because production
     * api does not respond to OPTIONS pre-flight as of this moment.
     */
    it.skip("should allow CORS and POST method", () => {
      let currentIpAddress = address();
      let regex = new RegExp("\\*|" + currentIpAddress);

      return request(baseURL)
        .options("/dictionary")
        .set(defaultHeaders)
        .expect(200)
        .expect("access-control-allow-origin", regex)
        .expect("access-control-allow-methods", /POST/);
    });

    it("unauthorized request should return 401", () => {
      return request(baseURL)
        .post("/dictionary")
        .set("Content-Type", defaultHeaders["Content-Type"])
        .expect(401);
    });

    it("should create new dictionary and return its ID", () => {
      return request(baseURL)
        .post("/dictionary")
        .set(defaultHeaders)
        .expect(201)
        .expect("Content-Type", "application/json")
        .expect(res => {
          expect(res.body.id).toBeDefined();

          // if ID is not gurenteed to be a string then
          // we could adjust accordingly
          expect(typeof res.body.id).toBe("string");
        });
    });
  });

  describe("DELETE /dictionary/:id", () => {
    beforeAll(async () => {
      // create new dictionary
      await request(baseURL)
        .post("/dictionary")
        .set(defaultHeaders)
        .then(res => {
          dictionaryId = res.body.id;
        });
    });
    afterAll(() => {
      dictionaryId = null;
    });
    it("unauthorized request should return 401", () => {
      return request(baseURL)
        .delete(`/dictionary/${dictionaryId}`)
        .set("Content-Type", defaultHeaders["Content-Type"])
        .expect(401);
    });

    it("should return 204 when dictionary is deleted", async () => {
      await request(baseURL)
        .delete(`/dictionary/${dictionaryId}`)
        .set(defaultHeaders)
        .expect(204);
    });

    // can't use supertest here due to an API issue where the api is returning
    // an html body while setting the content-type header to json causing
    // the test to fail due to json parsing error.
    it("should return 404 when accessing a deleted dictionary", done => {
      axios
        .get(`${baseURL}/dictionary/${dictionaryId}`, {
          headers: defaultHeaders
        })
        .then(res => {
          throw new Error("Resource is not deleted");
        })
        .catch(err => {
          expect(err.response.status).toBe(404);
          done();
        });
    });
  });

  /*
   * test block below is placed after DELETE test block to first insure
   * delete operations are passing because they are used in this
   * block for cleanup
   */
  describe("POST /dictionary/:id/keys/:key", () => {
    beforeAll(async () => {
      await request(baseURL)
        .post("/dictionary")
        .set(defaultHeaders)
        .then(res => {
          dictionaryId = res.body.id;
        });
    });
    afterAll(async () => {
      dictionaryId = null;
      await request(baseURL).delete(`/dictionary/${dictionaryId}`);
    });
    it("unauthorized request should return 401", () => {
      const key = "test-key";
      const value = "test-value";

      return request(baseURL)
        .post(`/dictionary/${dictionaryId}/keys/${key}`)
        .set("Content-Type", defaultHeaders["Content-Type"])
        .send({ value })
        .expect(401);
    });

    it("should create new key/value pair", () => {
      const key = "test-key-2";
      const value = "test-value-2";

      return request(baseURL)
        .post(`/dictionary/${dictionaryId}/keys/${key}`)
        .set(defaultHeaders)
        .send({ value })
        .expect("Content-Type", "application/json")
        .expect(200);
    });

    it("should modify an existing key value pair", async () => {
      const key = "test-key-4";
      const value = "test-value-4";
      const modifiedValue = "test-value-modified";

      // add new key
      await request(baseURL)
        .post(`/dictionary/${dictionaryId}/keys/${key}`)
        .set(defaultHeaders)
        .send({ value });

      // modify key
      await request(baseURL)
        .post(`/dictionary/${dictionaryId}/keys/${key}`)
        .set(defaultHeaders)
        .send({ value: modifiedValue })
        .expect("Content-Type", "application/json")
        .expect(200);

      // insures API response status is consistant by confirming that
      // value has in fact been changed
      await request(baseURL)
        .get(`/dictionary/${dictionaryId}/keys/${key}`)
        .set(defaultHeaders)
        .expect(200)
        .expect({ value: modifiedValue });
    });
  });
});
