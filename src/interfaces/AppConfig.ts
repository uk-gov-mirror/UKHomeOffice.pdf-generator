interface AppConfig {
    port: number;
    keycloak: {
        protocol: string,
        url: string,
        realm: string,
        client: {
            secret: string,
            id: string,
        },
    };
    aws: {
        s3: {
            protocol: string,
            endpoint: string,
            useSSL: boolean,
            port: number,
            accessKey: string,
            secretKey: string
            buckets: {
                pdf: string,
            },
        },
    };
    redis: {
        port: number,
        host: string,
        token: string,
    };
    correlationIdRequestHeader: string;
}

export default AppConfig;
