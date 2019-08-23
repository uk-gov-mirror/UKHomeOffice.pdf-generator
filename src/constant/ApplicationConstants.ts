export class ApplicationConstants {
    public static readonly USER_ID = 'x-user-email';
    public static readonly SERVICE_NAME = 'pdf-generator';
    public static readonly DEFAULT_CORRELATION_REQUEST_ID = 'x-request-id';
    public static readonly ANONYMOUS = 'anonymous';
    public static readonly SHUTDOWN_EVENT = 'shutdown';
    public static readonly PDF_QUEUE_NAME = 'pdf-queue';
    public static readonly WEB_HOOK_POST_QUEUE_NAME = 'web-hook-post-queue';

    public static readonly PDF_GENERATED_SUCCESS = 'pdf-generation-success';
    public static readonly PDF_GENERATION_FAILED = 'pdf-generation-failed';
}
