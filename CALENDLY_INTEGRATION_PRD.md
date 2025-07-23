# Product Requirements Document: Calendly Integration for Chatbot

## 1. Overview

This document outlines the requirements for integrating Calendly with the Viriato real estate chatbot. The goal of this feature is to allow users to schedule property viewings or consultations with agents directly from the chat interface. Since the Calendly API does not directly support scheduling events, this feature will be implemented by guiding the user to the appropriate Calendly booking page and embedding the Calendly view within the chat or a modal.

## 2. Goals

*   **Primary Goal**: Enable users to schedule meetings with real estate agents through the chatbot.
*   **Secondary Goal**: Improve user engagement and lead conversion by providing a seamless scheduling experience.
*   **Technical Goal**: Integrate Calendly's booking flow into the existing chatbot interface without a full page redirect.

## 3. User Stories

*   As a **user**, I want to be able to schedule a viewing for a specific property I'm interested in.
*   As a **user**, I want to schedule a general consultation with a real estate agent to discuss my needs.
*   As a **user**, I want the chatbot to recognize when I want to schedule a meeting and guide me through the process.
*   As a **real estate agent**, I want to receive booking notifications and see new appointments in my Calendly account.

## 4. Feature Requirements

### 4.1. Intent Recognition

*   The chatbot's NLU model must be trained to recognize user intent to schedule a meeting. This includes phrases like:
    *   "I want to book a viewing."
    *   "Can I schedule a call with an agent?"
    *   "How can I see this property?"
*   The chatbot should also be able to proactively suggest scheduling a meeting at appropriate times (e.g., after a user has expressed strong interest in a property).

### 4.2. Calendly Event Types

*   The system will need to be configured with different Calendly event types for different purposes. For example:
    *   **Property Viewing**: A specific event type for scheduling a visit to a particular property.
    *   **General Consultation**: A general-purpose meeting with an agent.
*   The application will use the Calendly API to fetch the available event types and their corresponding booking links.

### 4.3. User Flow for Scheduling

1.  **Trigger**: The user expresses intent to schedule a meeting, or the chatbot proactively suggests it.
2.  **Clarification**: The chatbot asks clarifying questions to determine the type of meeting the user wants to book (e.g., "Are you interested in a specific property, or would you like a general consultation?").
3.  **Property Identification**: If the user wants to view a specific property, the chatbot will use the conversation context to identify the property in question.
4.  **Agent/Event Type Selection**:
    *   The system will determine the appropriate Calendly event type based on the user's request. This may involve a simple lookup or a more complex routing logic (e.g., assigning agents based on property location).
    *   The system will fetch the corresponding Calendly booking link using the Calendly API.
5.  **Scheduling Interface**:
    *   The chatbot will present the Calendly booking interface to the user. This will be done using one of Calendly's embed options:
        *   **Inline Embed**: The Calendly booking form is displayed directly within the chat window.
        *   **Popup Widget**: A button in the chat opens the Calendly booking form in a modal window.
        *   **Popup Text**: A link in the chat opens the Calendly booking form in a modal window.
    *   The recommended approach is the **Popup Widget** or **Popup Text** to avoid disrupting the chat flow.
6.  **Pre-filling Information**:
    *   To streamline the booking process, the user's name and email (if available from the onboarding process) will be passed to the Calendly booking page as URL parameters.
7.  **Confirmation**:
    *   After the user completes the booking in the Calendly interface, Calendly will handle the confirmation emails to both the user and the agent.
    *   The chatbot will also provide a confirmation message to the user, such as: "Thank you! Your meeting has been scheduled. You will receive a confirmation email from Calendly shortly."

### 4.4. Technical Implementation

*   **Calendly API Integration**:
    *   A new service will be created to interact with the Calendly API.
    *   This service will handle authentication using a personal access token.
    *   It will have a function to list available event types and retrieve their booking links.
*   **Chatbot Logic**:
    *   The `ragChain` will be updated to include logic for recognizing scheduling intent.
    *   A new function will be added to the chat session manager to handle the scheduling flow.
*   **Frontend**:
    *   The `FloatingChatbot` component will be updated to handle the presentation of the Calendly embed.
    *   This will likely involve using a state variable to control the visibility of the Calendly modal and passing the appropriate booking link to it.
*   **Environment Variables**:
    *   A new environment variable, `CALENDLY_API_KEY`, will be added to store the Calendly personal access token.
    *   Another environment variable, `CALENDLY_USER_URI`, will be added to specify the Calendly user whose event types should be fetched.

## 5. Non-Functional Requirements

*   **Security**: The Calendly API key must be stored securely and only used on the server side.
*   **Usability**: The scheduling process should be as simple and intuitive as possible for the user.
*   **Reliability**: The integration should be robust and handle potential errors from the Calendly API gracefully.

## 6. Assumptions and Dependencies

*   The real estate agency has a Calendly account with at least a Standard subscription (to use webhooks for real-time notifications, if needed in the future).
*   The necessary event types are pre-configured in the Calendly account.
*   The user's browser allows embedding of third-party content. 