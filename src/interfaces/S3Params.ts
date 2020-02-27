export default interface S3Params {
    Bucket: string,
    Key: string,
    Body: any,
    ContentType: string,
    ServerSideEncryption?: string,
    SSEKMSKeyId?: string
}
