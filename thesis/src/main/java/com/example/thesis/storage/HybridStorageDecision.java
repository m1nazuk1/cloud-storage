package com.example.thesis.storage;

import com.example.thesis.config.StorageProperties;

public final class HybridStorageDecision {

    private HybridStorageDecision() {
    }

    public static boolean useObjectStoreForNewUploads(StorageProperties storageProperties,
                                                      boolean objectStorageBeanAvailable) {
        return storageProperties.isObjectEnabled()
                && objectStorageBeanAvailable
                && storageProperties.isNewFilesObject();
    }
}
