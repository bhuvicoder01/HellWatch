package com.hellwatch.streaming.model;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface VideoRepository extends MongoRepository<VideoEntity, String> {
}
