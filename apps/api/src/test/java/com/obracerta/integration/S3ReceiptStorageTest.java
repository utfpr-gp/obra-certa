package com.obracerta.integration;

import com.obracerta.exception.ReceiptException;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.io.ByteArrayInputStream;
import com.sun.net.httpserver.HttpServer;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicReference;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.Map;
import java.util.Properties;
import java.util.stream.Collectors;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.context.config.ConfigDataEnvironmentPostProcessor;
import org.springframework.core.env.MapPropertySource;
import org.springframework.core.env.StandardEnvironment;
import java.util.function.Consumer;
import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class S3ReceiptStorageTest {
    @Test void deletesTheExactPrivateObjectPhysically() {
        var client=mock(S3Client.class);
        new S3ReceiptStorage("private-bucket",client).delete("expenses/owned/receipt");
        verify(client).deleteObject(org.mockito.ArgumentMatchers.<Consumer<software.amazon.awssdk.services.s3.model.DeleteObjectRequest.Builder>>argThat(consumer -> {
            var builder=software.amazon.awssdk.services.s3.model.DeleteObjectRequest.builder();
            consumer.accept(builder);
            assertThat(builder.build().bucket()).isEqualTo("private-bucket");
            assertThat(builder.build().key()).isEqualTo("expenses/owned/receipt");
            return true;
        }));
        verifyNoMoreInteractions(client);
    }
    @Test void missingObjectIsAlreadyRemoved() {
        var client=mock(S3Client.class);
        doThrow(software.amazon.awssdk.services.s3.model.NoSuchKeyException.builder().statusCode(404).build())
                .when(client).deleteObject(org.mockito.ArgumentMatchers.<Consumer<software.amazon.awssdk.services.s3.model.DeleteObjectRequest.Builder>>any());
        assertThatCode(() -> new S3ReceiptStorage("private-bucket",client).delete("missing")).doesNotThrowAnyException();
    }
    @Test void storageFailuresNeverPretendDeletionSucceeded() {
        for (RuntimeException error : java.util.List.of(
                software.amazon.awssdk.services.s3.model.S3Exception.builder().statusCode(403).message("denied").build(),
                software.amazon.awssdk.services.s3.model.NoSuchBucketException.builder().statusCode(404).build(),
                software.amazon.awssdk.core.exception.SdkClientException.create("connection failed"))) {
            var client=mock(S3Client.class);
            doThrow(error).when(client).deleteObject(org.mockito.ArgumentMatchers.<Consumer<software.amazon.awssdk.services.s3.model.DeleteObjectRequest.Builder>>any());
            assertThatThrownBy(() -> new S3ReceiptStorage("private-bucket",client).delete("key"))
                    .isInstanceOf(ReceiptException.class)
                    .satisfies(exception -> assertThat(((ReceiptException)exception).status().value()).isEqualTo(503));
        }
        assertThatThrownBy(() -> new S3ReceiptStorage("","","","","",true).delete("key"))
                .isInstanceOf(ReceiptException.class);
    }
    @ParameterizedTest
    @ValueSource(strings={".","apps/api"})
    void loadsRootDotEnvFromNativeWorkingDirectories(String workingDirectory, @TempDir Path root) throws Exception {
        Files.createDirectories(root.resolve("apps/api"));
        Files.writeString(root.resolve(".env"),"RECEIPT_STORAGE_ENDPOINT=https://fixture.storage.supabase.co/storage/v1/s3\n"
                +"RECEIPT_STORAGE_BUCKET=fixture-private\nRECEIPT_STORAGE_REGION=fixture-region\n"
                +"RECEIPT_STORAGE_ACCESS_KEY=fixture-access\nRECEIPT_STORAGE_SECRET_KEY=fixture-secret\n");
        var configuration=new Properties();
        Path application=Path.of("src/main/resources/application.properties").toAbsolutePath();
        try (var input=Files.newInputStream(application)) { configuration.load(input); }
        assertThat(configuration.getProperty("spring.config.import")).isNotBlank();
        // Rebase the configured relative imports onto a fixture, never reading the real .env.
        Path cwd=root.resolve(workingDirectory);
        String imports=Arrays.stream(configuration.getProperty("spring.config.import").split(","))
                .map(String::trim).map(location -> {
                    String relative=location.replace("optional:file:","").replace("[.properties]","");
                    return "optional:"+cwd.resolve(relative).normalize().toUri()+"[.properties]";
                }).collect(Collectors.joining(","));
        var environment=new StandardEnvironment();
        environment.getPropertySources().addFirst(new MapPropertySource("fixture",Map.of(
                "spring.config.location",application.toUri().toString(),"spring.config.import",imports)));
        ConfigDataEnvironmentPostProcessor.applyTo(environment);
        assertThat(environment.getProperty("receipt.storage.endpoint"))
                .isEqualTo("https://fixture.storage.supabase.co/storage/v1/s3");
        assertThat(environment.getProperty("receipt.storage.bucket")).isEqualTo("fixture-private");
        assertThat(environment.getProperty("receipt.storage.region")).isEqualTo("fixture-region");
        assertThat(environment.getProperty("receipt.storage.access-key")).isEqualTo("fixture-access");
        assertThat(environment.getProperty("receipt.storage.secret-key")).isEqualTo("fixture-secret");
        assertThat(environment.getProperty("receipt.storage.path-style")).isEqualTo("true");
    }
    @Test void sendsEntireStreamIncludingExactTenMebibyteBoundary() throws Exception {
        var client=mock(S3Client.class);
        var storage=new S3ReceiptStorage("private-bucket",client);
        byte[] content=new byte[10485760]; content[content.length-1]=42;
        doAnswer(invocation -> {
            RequestBody body=invocation.getArgument(1);
            assertThat(body.optionalContentLength()).contains((long)content.length);
            try(var input=body.contentStreamProvider().newStream()) { assertThat(input.readAllBytes()).isEqualTo(content); }
            return null;
        }).when(client).putObject(org.mockito.ArgumentMatchers.<Consumer<PutObjectRequest.Builder>>any(),any(RequestBody.class));
        storage.put("expenses/id/receipt",new ByteArrayInputStream(content),content.length,"application/pdf");
        verify(client).putObject(org.mockito.ArgumentMatchers.<Consumer<PutObjectRequest.Builder>>any(),any(RequestBody.class));
    }
    @Test void usesSupabaseEndpointPathAndSigningAndTransfersOriginalBytes() throws Exception {
        var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        var path=new AtomicReference<String>();
        var authorization=new AtomicReference<String>();
        var uploaded=new AtomicReference<byte[]>();
        byte[] content="%PDF-1.7\nreceipt".getBytes(java.nio.charset.StandardCharsets.UTF_8);
        server.createContext("/storage/v1/s3/",exchange -> {
            path.set(exchange.getRequestURI().getPath());
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            if (exchange.getRequestMethod().equals("PUT")) {
                uploaded.set(exchange.getRequestBody().readAllBytes());
                exchange.sendResponseHeaders(200,-1);
            } else {
                exchange.sendResponseHeaders(200,content.length);
                exchange.getResponseBody().write(content);
            }
            exchange.close();
        });
        server.start();
        var storage=new S3ReceiptStorage("private-bucket",
                "http://127.0.0.1:"+server.getAddress().getPort()+"/storage/v1/s3",
                "sa-east-1","test-access","test-secret",true);
        try {
            storage.put("expenses/id/receipt",new ByteArrayInputStream(content),content.length,"application/pdf");
            assertThat(uploaded.get()).isEqualTo(content);
            assertThat(path.get()).isEqualTo("/storage/v1/s3/private-bucket/expenses/id/receipt");
            assertThat(authorization.get()).startsWith("AWS4-HMAC-SHA256 ")
                    .contains("Credential=test-access/").contains("/sa-east-1/s3/aws4_request");
            try (var downloaded=storage.get("expenses/id/receipt")) {
                assertThat(downloaded.readAllBytes()).isEqualTo(content);
            }
        } finally { storage.close(); server.stop(0); }
    }
    @Test void unconfiguredStorageFailsOnUseWithoutPretendingUploadSucceeded() {
        var storage=new S3ReceiptStorage("","","us-east-1","","",false);
        assertThatThrownBy(() -> storage.put("key",new ByteArrayInputStream(new byte[]{1}),1,"application/pdf"))
                .isInstanceOf(ReceiptException.class)
                .satisfies(error -> assertThat(((ReceiptException)error).status().value()).isEqualTo(503));
    }
}
