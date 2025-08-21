const { Core } = require('@adobe/aio-sdk');
const { processVariables } = require('./../../../../src/commerce-backend-ui-1/actions/utils/generation/processVariables.js');

jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn()
  }
}));

const mockLoggerInstance = {
  info: jest.fn(),
  debug: jest.fn(),
  error: jest.fn()
};
Core.Logger.mockReturnValue(mockLoggerInstance);

jest.mock('bwip-js');

beforeEach(() => {
  Core.Logger.mockClear();
  mockLoggerInstance.info.mockReset();
  mockLoggerInstance.debug.mockReset();
  mockLoggerInstance.error.mockReset();
});

describe('processVariables', () => {

    test('handlePlaceholder should be defined', () => {
        expect(processVariables).toBeInstanceOf(Function);
    });
    
    test('DATE variable have to be replaces with actual date', () => {

        // Mock Date to return a fixed point in time
        const fixedDate = new Date('2024-10-18T12:00:00Z');
        jest.useFakeTimers().setSystemTime(fixedDate);

        const input = '<?xml version="1.0"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><created_at>{{DATE}}</created_at>';
        const expectedOutput = '<?xml version="1.0"?><rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel><created_at>2024-10-18T12:00:00.000Z</created_at>';

        expect(processVariables(input)).toEqual(expectedOutput);

        // Restore the real timers after the test
        jest.useRealTimers();
    });
    
});