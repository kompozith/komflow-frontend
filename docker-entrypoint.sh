#!/bin/sh

# Générer environment.json à partir des variables d'environnement
cat > /usr/share/nginx/html/assets/environment.json <<EOF
{
  "apiUrl": "${API_URL}",
  "environment": "${APP_ENV}",
  "googleMapsApiKey": "${GOOGLE_MAPS_API_KEY}",
  "googleAuthClientId": "${GOOGLE_AUTH_CLIENT_ID}",
  "firebaseConfig": {
    "apiKey": "${FIREBASE_API_KEY}",
    "authDomain": "${FIREBASE_AUTH_DOMAIN}",
    "projectId": "${FIREBASE_PROJECT_ID}",
    "storageBucket": "${FIREBASE_STORAGE_BUCKET}",
    "messagingSenderId": "${FIREBASE_MESSAGING_SENDER_ID}",
    "appId": "${FIREBASE_APP_ID}",
    "measurementId": "${FIREBASE_MEASUREMENT_ID}"
  }
}
EOF

echo "Environment config generated: API_URL=$API_URL, APP_ENV=$APP_ENV"

# Lancer NGINX en foreground
exec nginx -g "daemon off;"