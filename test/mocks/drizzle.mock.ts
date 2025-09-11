export class MockDrizzleDB {
  insert = jest.fn().mockReturnThis();
  values = jest.fn().mockReturnThis();
  select = jest.fn().mockReturnThis();
  from = jest.fn().mockReturnThis();
  update = jest.fn().mockReturnThis();
  set = jest.fn().mockReturnThis();
  delete = jest.fn().mockReturnThis();
  where = jest.fn().mockReturnThis();
  returning = jest.fn();
}
