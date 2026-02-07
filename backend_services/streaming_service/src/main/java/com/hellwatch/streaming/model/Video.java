package com.hellwatch.streaming.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Video {
    private String id;
    private String title;
    private String filePath;
    private String contentType;
    private long fileSize;
}
