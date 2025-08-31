import { describe, it, expect, beforeEach } from 'vitest';
import { DB } from './db';
import type { Student, Course, StudySession } from '../types';

// Test suite for the mock database
describe('DB', () => {
  // Before each test, reset the database to ensure a clean state
  beforeEach(() => {
    DB.reset();
    localStorage.clear();
  });

  // --- Authentication and User Management ---

  describe('Authentication', () => {
    it('should create a user and set them as the current user', () => {
      const user = DB.createUser('Eli Monroe', 'eli_monroe');
      expect(user.name).toBe('Eli Monroe');
      expect(user.username).toBe('eli_monroe');
      const me = DB.me();
      expect(me).toBeDefined();
      expect(me?.id).toBe(user.id);
    });

    it('should throw an error for duplicate usernames (case-insensitive)', () => {
      DB.createUser('Test User', 'test_user');
      const action = () => DB.createUser('Another User', 'TEST_USER');
      expect(action).toThrow('Username already in use');
    });

    it('should throw an error for invalid username formats', () => {
      expect(() => DB.createUser('User', 'a')).toThrow('Invalid username format');
      expect(() => DB.createUser('User', 'user name')).toThrow('Invalid username format');
      expect(() => DB.createUser('User', 'a_very_long_username_that_is_invalid')).toThrow('Invalid username format');
    });

    it('should throw an error when logging in with a non-existent user', () => {
      const action = () => DB.login('non_existent_user');
      expect(action).toThrow('User not found');
    });

    it('should log a user out successfully', () => {
      DB.createUser('Test User', 'test_user');
      DB.login('test_user');
      expect(DB.me()).toBeDefined();

      DB.logout();
      expect(DB.me()).toBeUndefined();
    });
  });

  // --- Profile Management ---

  describe('Profile Management', () => {
    it('should get an existing user by username', () => {
      const createdUser = DB.createUser('Jane Doe', 'jane_doe');
      const foundUser = DB.getUserByUsername('jane_doe');
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
      expect(foundUser?.name).toBe('Jane Doe');
    });

    it('should get a user by username (case-insensitive)', () => {
      const createdUser = DB.createUser('John Smith', 'JohnSmith');
      const foundUser = DB.getUserByUsername('johnsmith');
      expect(foundUser).toBeDefined();
      expect(foundUser?.id).toBe(createdUser.id);
    });

    it('should return undefined for a non-existent username', () => {
      const foundUser = DB.getUserByUsername('non_existent_user');
      expect(foundUser).toBeUndefined();
    });
  });

  // --- Courses and Enrollments ---

  describe('Courses and Enrollments', () => {
    it('should enroll the current user in a course', () => {
      const user = DB.createUser('Jane Doe', 'jane_doe');
      DB.login('jane_doe');

      DB.addEnrollment('CPSC 2150-001');

      const myCourses = DB.listMyCourses();
      expect(myCourses.length).toBe(1);
      expect(myCourses[0].code).toBe('CPSC 2150-001');

      const dbState = DB.dump();
      expect(dbState.courses.length).toBe(1);
      expect(dbState.enrollments.length).toBe(1);
      expect(dbState.enrollments[0].studentId).toBe(user.id);
    });

    it('should throw an error when adding a course without being logged in', () => {
      const action = () => DB.addEnrollment('CPSC 3720-001');
      expect(action).toThrow('Not logged in');
    });

    it('should throw an error when adding a duplicate course', () => {
      DB.createUser('Test User', 'test_user');
      DB.login('test_user');
      DB.addEnrollment('CPSC 3720-001');
      const action = () => DB.addEnrollment('CPSC 3720-001');
      expect(action).toThrow('Course already added');
    });

    it('should not include the current user in the classmates list', () => {
      const user1 = DB.createUser('User One', 'user_one');
      const user2 = DB.createUser('User Two', 'user_two');
      DB.login('user_one');
      DB.addEnrollment('CS 101-001');
      DB.logout();
      DB.login('user_two');
      DB.addEnrollment('CS 101-001');

      const classmates = DB.classmates('CS 101-001');
      expect(classmates.length).toBe(1);
      expect(classmates[0].id).toBe(user1.id);
    });

    it('should return an empty array for a course with no other classmates', () => {
      DB.createUser('Solo Student', 'solo_student');
      DB.login('solo_student');
      DB.addEnrollment('ART 101-001');

      const classmates = DB.classmates('ART 101-001');
      expect(classmates).toEqual([]);
    });

    it('should return an empty array for a non-existent course', () => {
      const classmates = DB.classmates('FAKE-1010-001');
      expect(classmates).toEqual([]);
    });
  });

  // --- Study Session Management ---

  describe('Study Sessions', () => {
    it('should create a study session request', () => {
      const requester = DB.createUser('Requester', 'requester');
      const requestee = DB.createUser('Requestee', 'requestee');
      const course = DB.getOrCreateCourse('MATH 2060-002');
      DB.login('requester');
      
      const proposedTime = new Date('2025-09-05T14:00:00Z').getTime();
      const session = DB.createStudySessionRequest(requestee.id, course.id, proposedTime);

      expect(session.requesterId).toBe(requester.id);
      expect(session.requesteeId).toBe(requestee.id);
      expect(session.courseId).toBe(course.id);
      expect(session.status).toBe('pending');
      expect(session.time).toBe(proposedTime);

      const dbState = DB.dump();
      expect(dbState.studySessions.length).toBe(1);
      expect(dbState.studySessions[0].id).toBe(session.id);
    });

    it('should throw an error when a user sends a request to themselves', () => {
      const user = DB.createUser('Self Requester', 'self_requester');
      const course = DB.getOrCreateCourse('PHYS 1010-001');
      DB.login('self_requester');
      const proposedTime = Date.now();

      const action = () => DB.createStudySessionRequest(user.id, course.id, proposedTime);
      expect(action).toThrow('You cannot send a study request to yourself.');
    });
  });
});
