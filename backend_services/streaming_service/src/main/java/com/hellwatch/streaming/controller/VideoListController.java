package com.hellwatch.streaming.controller;

import com.hellwatch.streaming.model.VideoEntity;
import com.hellwatch.streaming.model.VideoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/videos")
@RequiredArgsConstructor
public class VideoListController {
    
    private final VideoRepository videoRepository;
    
    @GetMapping
    public List<VideoEntity> listVideos() {
        return videoRepository.findAll();
    }
}
