package com.mathtutor.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/legacy")
public class LegacyIndexController {

    @GetMapping
    public String redirectToIndex() {
        return "redirect:/legacy/index.html";
    }
}
