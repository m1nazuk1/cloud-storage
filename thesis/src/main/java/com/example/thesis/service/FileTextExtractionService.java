package com.example.thesis.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.nio.CharBuffer;
import java.nio.charset.CodingErrorAction;
import java.nio.charset.StandardCharsets;

@Service
public class FileTextExtractionService {

    private static final int MAX_INDEX_CHARS = 500_000;
    private static final int MAX_SNAPSHOT_CHARS = 200_000;

    public String extractForIndex(byte[] data, String mimeType, String originalName) {
        return truncate(extractRaw(data, mimeType, originalName), MAX_INDEX_CHARS);
    }

    public String extractForSnapshot(byte[] data, String mimeType, String originalName) {
        return truncate(extractRaw(data, mimeType, originalName), MAX_SNAPSHOT_CHARS);
    }

    private String extractRaw(byte[] data, String mimeType, String originalName) {
        if (data == null || data.length == 0) {
            return "";
        }
        String mt = mimeType != null ? mimeType.toLowerCase() : "";
        String ext = extension(originalName);
        if ("pdf".equals(ext) || mt.contains("pdf")) {
            return extractPdf(data);
        }
        if (mt.startsWith("text/") || isPlainTextExtension(ext)) {
            return decodeUtf8Lenient(data);
        }
        return "";
    }

    private static boolean isPlainTextExtension(String ext) {
        return ext.equals("txt") || ext.equals("md") || ext.equals("csv") || ext.equals("json")
                || ext.equals("xml") || ext.equals("html") || ext.equals("htm")
                || ext.equals("css") || ext.equals("js") || ext.equals("ts") || ext.equals("tsx")
                || ext.equals("jsx") || ext.equals("java") || ext.equals("py") || ext.equals("c")
                || ext.equals("h") || ext.equals("cpp") || ext.equals("go") || ext.equals("rs")
                || ext.equals("yml") || ext.equals("yaml") || ext.equals("properties")
                || ext.equals("sql") || ext.equals("sh") || ext.equals("log");
    }

    private String extractPdf(byte[] data) {
        try (PDDocument doc = Loader.loadPDF(data)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        } catch (Exception e) {
            return "";
        }
    }

    private String decodeUtf8Lenient(byte[] data) {
        try {
            CharBuffer cb = StandardCharsets.UTF_8.newDecoder()
                    .onMalformedInput(CodingErrorAction.REPLACE)
                    .onUnmappableCharacter(CodingErrorAction.REPLACE)
                    .decode(ByteBuffer.wrap(data));
            String s = cb.toString();
            if (s.indexOf('\uFFFD') > data.length / 4) {
                return new String(data, java.nio.charset.Charset.forName("windows-1252"));
            }
            return s;
        } catch (Exception e) {
            return new String(data, StandardCharsets.UTF_8);
        }
    }

    private static String extension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        if (s.length() <= max) {
            return s;
        }
        return s.substring(0, max) + "\n… [truncated]";
    }
}
