package com.mathtutor.service;

import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Base64;

/**
 * Downsizes and re-encodes data-URL images before the vision call. Vision tokens
 * scale with resolution; capping the longest edge to MAX_DIM cuts vision spend
 * substantially with no meaningful quality loss for hand-written math.
 */
@Component
public class ImageOptimizer {

    static final int MAX_DIM = 1568;
    static final int MAX_BYTES = 3 * 1024 * 1024;

    public String optimizeDataUrl(String dataUrl) throws IOException {
        if (dataUrl == null) {
            return null;
        }
        int comma = dataUrl.indexOf(',');
        if (comma < 0) {
            return dataUrl;
        }
        String base64 = dataUrl.substring(comma + 1);
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(base64);
        } catch (IllegalArgumentException e) {
            throw new IOException("Invalid image data");
        }
        if (bytes.length == 0) {
            throw new IOException("Empty image data");
        }

        BufferedImage image = readImage(bytes);
        if (image == null) {
            return dataUrl;
        }
        if (bytes.length <= MAX_BYTES && image.getWidth() <= MAX_DIM && image.getHeight() <= MAX_DIM) {
            return dataUrl;
        }
        return reencode(image);
    }

    private BufferedImage readImage(byte[] bytes) throws IOException {
        try (InputStream in = new ByteArrayInputStream(bytes)) {
            return ImageIO.read(in);
        }
    }

    private String reencode(BufferedImage image) throws IOException {
        double scale = Math.min(1.0, (double) MAX_DIM / image.getWidth());
        scale = Math.min(scale, (double) MAX_DIM / image.getHeight());
        int width = Math.max(1, (int) (image.getWidth() * scale));
        int height = Math.max(1, (int) (image.getHeight() * scale));
        BufferedImage resized = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = resized.createGraphics();
        g.drawImage(image, 0, 0, width, height, null);
        g.dispose();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(resized, "jpg", out);
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(out.toByteArray());
    }
}
