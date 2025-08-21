const { Core } = require('@adobe/aio-sdk');
const { handlePlaceholder, wrapInCDATAIfNeeded } = require('./../../../src/commerce-backend-ui-1/actions/utils/placeholderHandler.js');

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

describe('placeholderHandler', () => {

    test('handlePlaceholder should be defined', () => {
        expect(handlePlaceholder).toBeInstanceOf(Function);
    });
    
    test('wrapInCDATAIfNeeded have to add CDATA wrap for a complex strings', () => {
        let value = wrapInCDATAIfNeeded("It includes characters like <, >, and &")
        expect(value).toEqual("<![CDATA[It includes characters like <, >, and &]]>");

        value = wrapInCDATAIfNeeded("It includes characters like ]]>")
        expect(value).toEqual("<![CDATA[It includes characters like ]]]]><![CDATA[>]]>");

        value = wrapInCDATAIfNeeded("It includes usual string")
        expect(value).toEqual("It includes usual string");

        value = wrapInCDATAIfNeeded(null);
        expect(value).toEqual("");    

        value = wrapInCDATAIfNeeded(undefined);
        expect(value).toEqual("");
    });
    
});