# Documentation: How to Embed the Viriato Chatbot

This guide will walk you through the steps to embed the Viriato Chatbot on your website.

## 1. Getting Your API Key

First, you need to get your unique API key from the Viriato admin dashboard.

1.  Log in to your Viriato admin account.
2.  Navigate to the **Client Management** tab.
3.  Click the "Edit" button next to the client you want to configure.
4.  In the modal that appears, click on the **Website Integration** tab.
5.  Here you will find your API key. Click the "Copy" button to copy it to your clipboard.

## 2. Whitelisting Your Domain

For security, your API key will only work on domains that you have whitelisted.

1.  In the **Website Integration** tab, you will see a section for **Whitelisted Domains**.
2.  Enter the domain of your website (e.g., `yourwebsite.com`) and click "Add Domain".
3.  You can add multiple domains if you want to use the chatbot on different websites.

## 3. Embedding the Chatbot

To add the chatbot to your website, you need to add a small script tag to your HTML.

1.  Copy the following script tag and paste it just before the closing `</body>` tag of your HTML file:

    ```html
    <script 
        src="https://your-app-domain.vercel.app/loader.js" 
        async defer>
    </script>

    <viriato-chatbot api-key="YOUR_API_KEY"></viriato-chatbot>
    ```

2.  Replace `your-app-domain.vercel.app` with the domain of your Vercel deployment (e.g., `viriatochatbot.vercel.app`).
3.  Replace `YOUR_API_KEY` with the API key you copied from the admin dashboard.

> [!IMPORTANT]
> **Using React, Next.js, or another TSX-based framework?**
> If you encounter a TypeScript error like `Property 'viriato-chatbot' does not exist on type 'JSX.IntrinsicElements'`, it means your project doesn't recognize our custom HTML tag. Follow these steps to fix it:
>
> #### 1. Create a Type Declaration File
>
> In your project's `src` or root directory, create a new file named `viriato.d.ts`.
>
> #### 2. Add the Custom Element Definition
>
> Copy and paste the following code into the `viriato.d.ts` file. This tells TypeScript to recognize `<viriato-chatbot>` and its properties.
>
> ```typescript
> import 'react';
>
> declare module 'react' {
>   namespace JSX {
>     interface IntrinsicElements {
>       'viriato-chatbot': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { 'api-key'?: string }, HTMLElement>;
>     }
>   }
> }
> ```
>
> #### 3. Update Your `tsconfig.json`
>
> Make sure your project's `tsconfig.json` includes the new declaration file. Add it to the `include` array:
>
> ```json
> {
>   "compilerOptions": {
>     // ... your existing options
>   },
>   "include": [
>     // ... other paths
>     "viriato.d.ts" 
>   ]
> }
> ```
> *This step is often automatic in modern frameworks, but it's good to verify.*
>
> **Special Note for older Next.js / React versions:** 
> If the above solution doesn't work, you might be on an older version. Try this global declaration instead in your `viriato.d.ts`:
>
> ```typescript
> declare global {
>   namespace JSX {
>     interface IntrinsicElements {
>       "viriato-chatbot": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & { "api-key"?: string }, HTMLElement>;
>     }
>   }
> }
> ```

That's it! The chatbot should now appear on your website according to the position you configured in the dashboard.

## 4. Customizing the Widget

You can customize the appearance and position of your chatbot widget from the admin dashboard.

1.  Go to the **Widget Customization** tab in the client editing modal.
2.  Here you can:
    *   **Choose a primary color:** Select a color that matches your brand.
    *   **Set a launcher icon:** Provide a URL to an image to use as the launcher icon.
    *   **Set the position:** Choose whether the widget should appear on the bottom right or bottom left of the screen.
3.  The live preview will show you how the widget will look.
4.  Click "Save Settings" to apply your changes. The widget on your website will update automatically. 