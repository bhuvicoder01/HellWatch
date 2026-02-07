package com.hellwatch.streaming.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Map;

@Data
@Document(collection = "videos")
public class VideoEntity {
    @Id
    private String id;
    private String title;
    private String key;
    private String thumbnail;
    private Map<String, String> qualities;
}
