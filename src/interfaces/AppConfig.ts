interface AppConfig {
    port: number;
    keycloak: {
        sessionSecret: string,
        uri: string,
        realm: string,
        client: {
            secret: string,
            id: string,
        },
    };
    arena: {
        accessRoles: string[],
    };
    aws: {
        s3: {
            protocol: string,
            endpoint: string,
            useSSL: boolean,
            port: number,
            accessKey: string,
            secretKey: string,
            region: string,
            buckets: {
                pdf: string,
            },
        },
    };
    redis: {
        port: number,
        host: string,
        token: string,
        ssl: boolean,
    };
    correlationIdRequestHeader: string;
}

export default AppConfig;
