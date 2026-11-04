package com.obracerta.integration;

import com.obracerta.exception.ReceiptException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.core.checksums.RequestChecksumCalculation;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;
import java.io.InputStream;
import java.net.URI;

@Component
public class S3ReceiptStorage implements ReceiptStorage {
    private final String bucket;
    private final String endpoint;
    private final String region;
    private final String accessKey;
    private final String secretKey;
    private final boolean pathStyle;
    private S3Client client;

    @Autowired
    public S3ReceiptStorage(@Value("${receipt.storage.bucket:}") String bucket,
            @Value("${receipt.storage.endpoint:}") String endpoint,
            @Value("${receipt.storage.region:}") String region,
            @Value("${receipt.storage.access-key:}") String accessKey,
            @Value("${receipt.storage.secret-key:}") String secretKey,
            @Value("${receipt.storage.path-style:true}") boolean pathStyle) {
        this.bucket=bucket; this.endpoint=endpoint; this.region=region;
        this.accessKey=accessKey; this.secretKey=secretKey; this.pathStyle=pathStyle;
    }
    public S3ReceiptStorage(String bucket, S3Client client) {
        this(bucket,"","","","",true);
        this.client=client;
    }
    // Lazy: financial flows and startup do not require storage credentials or network.
    private synchronized S3Client client() {
        if (bucket.isBlank()) throw unavailable();
        if (client==null) {
            // Send ordinary object bytes to the S3-compatible endpoint, without AWS streaming trailers.
            var builder=S3Client.builder().region(Region.of(region)).forcePathStyle(pathStyle)
                    .requestChecksumCalculation(RequestChecksumCalculation.WHEN_REQUIRED)
                    .serviceConfiguration(configuration -> configuration.chunkedEncodingEnabled(false));
            if (!endpoint.isBlank()) builder.endpointOverride(URI.create(endpoint));
            builder.credentialsProvider(accessKey.isBlank() ? DefaultCredentialsProvider.create()
                    : StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey,secretKey)));
            client=builder.build();
        }
        return client;
    }
    @Override public void put(String key, InputStream content, long length, String contentType) {
        try {
            client().putObject(request -> request.bucket(bucket).key(key).contentType(contentType),
                    RequestBody.fromInputStream(content,length));
        } catch (RuntimeException exception) { throw unavailable(); }
    }
    @Override public InputStream get(String key) {
        try { return client().getObject(request -> request.bucket(bucket).key(key)); }
        catch (RuntimeException exception) { throw unavailable(); }
    }
    @Override public void delete(String key) {
        try { client().deleteObject(request -> request.bucket(bucket).key(key)); }
        catch (NoSuchKeyException exception) { /* An absent object is already removed. */ }
        catch (S3Exception exception) {
            if (exception.statusCode()==404 && exception.awsErrorDetails()!=null
                    && "NoSuchKey".equals(exception.awsErrorDetails().errorCode())) return;
            throw unavailable();
        } catch (RuntimeException exception) { throw unavailable(); }
    }
    @jakarta.annotation.PreDestroy public synchronized void close() { if (client!=null) client.close(); }
    private static ReceiptException unavailable() {
        return new ReceiptException(HttpStatus.SERVICE_UNAVAILABLE,"Armazenamento do comprovante indisponível. Tente novamente.");
    }
}
