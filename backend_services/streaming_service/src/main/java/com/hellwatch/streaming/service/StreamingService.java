package com.hellwatch.streaming.service;

import com.hellwatch.streaming.model.VideoEntity;
import com.hellwatch.streaming.model.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;

import java.io.IOException;
import java.io.InputStream;

@Service
@RequiredArgsConstructor
public class StreamingService {
    
    private final S3Client s3Client;
    private final VideoRepository videoRepository;
    
    @Value("${aws.s3.bucket}")
    private String bucket;
    
    public VideoEntity getVideo(String id) {
        return videoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Video not found: " + id));
    }
    
    public long getVideoSize(String key) throws IOException {
        HeadObjectResponse response = s3Client.headObject(
                HeadObjectRequest.builder().bucket(bucket).key(key).build());
        return response.contentLength();
    }
    
    public InputStream getVideoStream(String key, Long start, Long end) {
        GetObjectRequest.Builder builder = GetObjectRequest.builder()
                .bucket(bucket)
                .key(key);
        
        if (start != null && end != null) {
            builder.range("bytes=" + start + "-" + end);
        }
        
        return s3Client.getObject(builder.build());
    }
}
