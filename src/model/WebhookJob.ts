export class WebhookJob {
    public readonly url: string;
    public readonly payload: object;

    constructor(url: any,
                payload: {
                    event: string,
                    data: object,
                }) {
        this.url = url;
        this.payload = payload;
    }
}
