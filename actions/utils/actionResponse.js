class ActionResponse {
    statusCode;
    body;

    /**
     * Init object
     *
     * @param statusCode
     * @param body
     */
    constructor(statusCode, body) {
        this.statusCode = statusCode;
        this.body = body;
    }

    /**
     * Get status code
     *
     * @return int|string
     */
    getStatusCode() {
        return this.statusCode;
    }

    /**
     * Set status code
     *
     * @param statusCode int|string
     * @return ActionResponse
     */
    setStatusCode(statusCode) {
        this.statusCode = statusCode;
        return this;
    }

    /**
     * Get body
     *
     * @return mixed
     */
    getBody() {
        return this.body;
    }

    /**
     * Set body
     *
     * @param statusCode mixed
     * @return ActionResponse
     */
    setBody(body) {
        this.body = body;
        return this;
    }

    /**
     * Get data
     *
     * @return object
     */
    getData() {
        return {
            statusCode: this.statusCode,
            body: this.body
        }
    }
}

module.exports = {ActionResponse};