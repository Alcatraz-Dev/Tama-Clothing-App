# Tama Clothing - System Architecture Overview

## 1. Introduction
Tama Clothing is a premium fashion e-commerce platform designed for the Tunisian market. This document outlines the technical architecture, ensuring scalability, security, and a high-end user experience.

## 2. High-Level Architecture
The platform follows a Serverless Backend-as-a-Service (BaaS) architecture using **Firebase**.

### Components:
- **Client Side**: 
  - **Customer Mobile App**: Cross-platform (iOS/Android) built with Flutter (for fluid animations) or React Native.
  - **Admin Web Dashboard**: Modern React/Next.js application.
- **Backend (Firebase)**:
  - **Authentication**: Managed identity service for customers and admins.
  - **Cloud Firestore**: Real-time NoSQL database for products, orders, and users.
  - **Cloud Storage**: Hosting for high-resolution product images and brand assets.
  - **Cloud Functions**: Server-side logic for order processing, payment integration, and notifications.
  - **Hosting**: Fast delivery of the Admin Web Dashboard and potentially a web version of the storefront.

## 3. Technology Stack
- **Frontend (Mobile)**: React Native (with Reanimated for premium transitions).
- **Frontend (Admin)**: Next.js + Vanilla CSS (for speed and custom premium styling).
- **Backend**: Firebase.
- **Payment Gateways**: Modular integration with local Tunisian providers (e.g., Paymee, ClickToPay) and COD support.

## 4. Multi-language Support
- **Architecture**: I18n implemented at the client level with content served from Firestore.
- **Languages**: French (Fr) and Tunisian Arabic (Derja - Ar-TN).

---

# Firebase Services Usage Map

| Service | Purpose | Key Features Used |
| :--- | :--- | :--- |
| **Authentication** | User identity management | Email/Password, Google Auth, Role-based claims (Admin vs User) |
| **Cloud Firestore** | Primary database | Real-time updates, offline persistence, atomic transactions |
| **Cloud Storage** | Media asset storage | High-res product images, CDN delivery, resizing (via Extensions) |
| **Cloud Functions** | Backend logic | `onOrderCreated` triggers, Payment gateway webhooks, Push notifications |
| **Security Rules** | Access control | Granular CRUD permissions based on user roles and document ownership |
| **App Check** | Security | Protects APIs from abuse by ensuring requests come from legitimate apps |
| **Cloud Messaging (FCM)**| Engagement | Push notifications for order status updates and marketing |
