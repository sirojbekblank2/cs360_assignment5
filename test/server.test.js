import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, test } from "node:test";
import { createAppServer } from "../src/server.js";

describe("Transcript Manager HTTP API", () => {
  let server;
  let baseURL;

  beforeEach(async () => {
    server = createAppServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    baseURL = `http://127.0.0.1:${server.address().port}`;
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  async function request(method, path, body) {
    const response = await fetch(`${baseURL}${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await response.text();
    return { status: response.status, body: text ? JSON.parse(text) : undefined };
  }

  test("BUG-101: a deleted student's grade request returns 404", async () => {
    const { body } = await request("POST", "/transcripts", { name: "Ada" });
    const { studentID } = body;
    assert.equal((await request("POST", `/transcripts/${studentID}/CS360`, { grade: 90 })).status, 201);
    assert.equal((await request("GET", `/transcripts/${studentID}/CS360`)).status, 200);

    assert.equal((await request("DELETE", `/transcripts/${studentID}`)).status, 204);

    const response = await request("GET", `/transcripts/${studentID}/CS360`);
    assert.equal(response.status, 404);
    assert.match(response.body.error, /not found/);
  });
});
