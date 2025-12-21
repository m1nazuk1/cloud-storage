//package com.example.thesis;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.CommandLineRunner;
//import org.springframework.mail.SimpleMailMessage;
//import org.springframework.mail.javamail.JavaMailSender;
//import org.springframework.stereotype.Component;
//
//@Component
//public class TestEmail implements CommandLineRunner {
//
//    @Autowired
//    private JavaMailSender mailSender;
//
//    @Override
//    public void run(String... args) throws Exception {
//        System.out.println("\n=== TESTING MAILTRAP CONNECTION ===");
//
//        try {
//            SimpleMailMessage message = new SimpleMailMessage();
//            message.setFrom("no-reply@thesis-app.com");
//            message.setTo("test@example.com");
//            message.setSubject("Test from Thesis");
//            message.setText("Testing Mailtrap connection...");
//
//            mailSender.send(message);
//            System.out.println("✅ Test email sent successfully!");
//        } catch (Exception e) {
//            System.err.println("❌ Test failed: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
//}