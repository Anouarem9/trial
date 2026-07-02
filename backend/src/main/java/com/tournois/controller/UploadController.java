package com.tournois.controller;

import com.tournois.entity.Equipe;
import com.tournois.entity.Joueur;
import com.tournois.repository.EquipeRepository;
import com.tournois.repository.JoueurRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

    private static final Set<String> ALLOWED = Set.of("image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif");
    private static final long MAX_BYTES = 5L * 1024 * 1024; // 5MB

    private final EquipeRepository equipeRepository;
    private final JoueurRepository joueurRepository;

    @Value("${app.uploads.dir:uploads}")
    private String uploadsDir;

    @PostMapping(value = "/equipes/{id}/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadTeamLogo(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Equipe e = equipeRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Équipe introuvable"));
        String url = saveFile(file, "team-" + id);
        e.setLogoUrl(url);
        equipeRepository.save(e);
        return Map.of("logoUrl", url);
    }

    @PostMapping(value = "/joueurs/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, String> uploadPlayerPhoto(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Joueur j = joueurRepository.findById(id).orElseThrow(() -> new EntityNotFoundException("Joueur introuvable"));
        String url = saveFile(file, "player-" + id);
        j.setPhotoUrl(url);
        joueurRepository.save(j);
        return Map.of("photoUrl", url);
    }

    private String saveFile(MultipartFile file, String prefix) throws IOException {
        if (file.isEmpty()) throw new IllegalArgumentException("Fichier vide");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Fichier trop volumineux (max 5MB)");
        String ct = file.getContentType();
        if (ct == null || !ALLOWED.contains(ct)) {
            throw new IllegalArgumentException("Format non supporté. Utilisez PNG, JPG, WEBP ou GIF.");
        }
        String original = file.getOriginalFilename() == null ? "img" : file.getOriginalFilename();
        String ext = original.contains(".") ? original.substring(original.lastIndexOf('.')) : "";
        String name = prefix + "-" + UUID.randomUUID().toString().substring(0, 8) + ext.toLowerCase();
        Path dir = Paths.get(uploadsDir).toAbsolutePath();
        Files.createDirectories(dir);
        Path dest = dir.resolve(name);
        file.transferTo(dest.toFile());
        return "/uploads/" + name;
    }
}
