import assert from "node:assert/strict";
import { beforeEach, describe, test } from "node:test";
import { TranscriptStore } from "../src/transcriptStore.js";

// REF-201: addGrade and changeGrade must keep validating courses and grades the same way.
// These tests pin the current public behavior so the shared validation can be refactored safely.
describe("REF-201: course and grade validation", () => {
  let store;
  let studentID;

  beforeEach(() => {
    store = new TranscriptStore();
    studentID = store.addStudent("Mia");
    store.addGrade(studentID, "CS360", 80);
  });

  // addGrade is checked on a new course and changeGrade on an existing one,
  // so only the shared validation rules decide each outcome.
  for (const { method, course } of [
    { method: "addGrade", course: "math101" },
    { method: "changeGrade", course: "cs360" },
  ]) {
    test(`${method} requires a course name`, () => {
      for (const blankCourse of ["", "   ", undefined, null]) {
        assert.throws(() => store[method](studentID, blankCourse, 90), {
          message: "Course name is required",
        });
      }
    });

    test(`${method} only accepts whole-number grades from 0 to 100`, () => {
      for (const badGrade of [-1, 101, 85.5, "abc", undefined]) {
        assert.throws(() => store[method](studentID, course, badGrade), {
          message: "Grade must be an integer from 0 to 100",
        });
      }
    });

    test(`${method} trims and upper-cases the course name`, () => {
      assert.deepEqual(store[method](studentID, `  ${course} `, "100"), {
        studentID,
        course: course.toUpperCase(),
        grade: 100,
      });
    });
  }

  test("both accept the boundary grades 0 and 100", () => {
    assert.equal(store.addGrade(studentID, "MATH101", 0).grade, 0);
    assert.equal(store.changeGrade(studentID, "MATH101", 100).grade, 100);
    assert.equal(store.changeGrade(studentID, "CS360", 0).grade, 0);
  });

  test("changeGrade still reports a course that has no grade", () => {
    assert.throws(() => store.changeGrade(studentID, "math101", 90), {
      message: "Grade not found for course MATH101",
    });
  });

  test("getGrade uses the same course normalization", () => {
    assert.equal(store.getGrade(studentID, " cs360 "), 80);
    assert.equal(store.getGrade(studentID, "MATH101"), undefined);
  });
});
