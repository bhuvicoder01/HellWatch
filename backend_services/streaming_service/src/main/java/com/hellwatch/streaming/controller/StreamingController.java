package com.hellwatch.streaming.controller;

import com.hellwatch.streaming.model.VideoEntity;
import com.hellwatch.streaming.service.StreamingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
public class StreamingController {

    private final StreamingService streamingService;

    @GetMapping("/stream/{id}")
    public ResponseEntity<byte[]> streamVideo(
            @PathVariable String id,
            @RequestParam(required = false, defaultValue = "original") String quality,
            @RequestHeader(value = "Range", required = false) String rangeHeader) throws IOException {
        
        VideoEntity video = streamingService.getVideo(id);
        String key = video.getKey();
        
        if (!"original".equals(quality) && video.getQualities() != null && video.getQualities().containsKey(quality)) {
            key = video.getQualities().get(quality);
        }
        
        long fileSize = streamingService.getVideoSize(key);

        if (rangeHeader == null) {
            try (InputStream inputStream = streamingService.getVideoStream(key, null, null)) {
                byte[] data = inputStream.readAllBytes();
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "video/mp4")
                        .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(fileSize))
                        .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                        .body(data);
            }
        }

        String[] ranges = rangeHeader.replace("bytes=", "").split("-");
        long start = Long.parseLong(ranges[0]);
        long end = ranges.length > 1 && !ranges[1].isEmpty() ? Long.parseLong(ranges[1]) : Math.min(start + (3 * 1024 * 1024), fileSize - 1);
        long contentLength = end - start + 1;

        try (InputStream inputStream = streamingService.getVideoStream(key, start, end)) {
            byte[] data = inputStream.readAllBytes();
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.CONTENT_TYPE, "video/mp4")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(contentLength))
                    .header(HttpHeaders.CONTENT_RANGE, "bytes " + start + "-" + end + "/" + fileSize)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .body(data);
        }
    }
}
