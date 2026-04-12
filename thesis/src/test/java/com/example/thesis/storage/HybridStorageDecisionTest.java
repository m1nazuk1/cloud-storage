package com.example.thesis.storage;

import com.example.thesis.config.StorageProperties;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HybridStorageDecisionTest {

    @Test
    void whenObjectEnabledBeanPresentAndNewFilesObject_returnsTrue() {
        StorageProperties p = new StorageProperties();
        p.setObjectEnabled(true);
        p.setNewFiles("object");
        assertTrue(HybridStorageDecision.useObjectStoreForNewUploads(p, true));
    }

    @Test
    void whenObjectDisabled_returnsFalse() {
        StorageProperties p = new StorageProperties();
        p.setObjectEnabled(false);
        p.setNewFiles("object");
        assertFalse(HybridStorageDecision.useObjectStoreForNewUploads(p, true));
    }

    @Test
    void whenObjectBeanMissing_returnsFalse() {
        StorageProperties p = new StorageProperties();
        p.setObjectEnabled(true);
        p.setNewFiles("object");
        assertFalse(HybridStorageDecision.useObjectStoreForNewUploads(p, false));
    }

    @Test
    void whenNewFilesLocal_returnsFalse() {
        StorageProperties p = new StorageProperties();
        p.setObjectEnabled(true);
        p.setNewFiles("local");
        assertFalse(HybridStorageDecision.useObjectStoreForNewUploads(p, true));
    }

    @Test
    void whenNewFilesObjectCaseInsensitive_stillWorksWithDecision() {
        StorageProperties p = new StorageProperties();
        p.setObjectEnabled(true);
        p.setNewFiles("OBJECT");
        assertTrue(HybridStorageDecision.useObjectStoreForNewUploads(p, true));
    }
}
