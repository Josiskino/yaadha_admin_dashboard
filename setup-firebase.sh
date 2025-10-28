#!/bin/bash

echo "🔥 Configuration Firebase pour Vue.js"
echo ""

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: Vous devez être dans le répertoire du projet Vue.js"
    exit 1
fi

echo "✅ Répertoire du projet détecté"
echo ""

# Vérifier que Firebase CLI est installé
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI n'est pas installé"
    echo "Installez-le avec: npm install -g firebase-tools"
    exit 1
fi

echo "✅ Firebase CLI détecté: $(firebase --version)"
echo ""

# Configuration Firebase pour Vue.js
echo "📋 Configuration recommandée pour Vue.js:"
echo ""
echo "1. Sélectionnez ces services:"
echo "   ✅ Firestore: Configure security rules and indexes files for Firestore"
echo "   ✅ Hosting: Set up deployments for static web apps"
echo ""
echo "2. Configuration Hosting:"
echo "   • Public directory: dist"
echo "   • Single-page app: Yes"
echo "   • Automatic builds: No"
echo ""
echo "3. Configuration Firestore:"
echo "   • Use existing rules: Yes (si vous avez déjà des règles)"
echo "   • Use existing indexes: Yes (si vous avez déjà des index)"
echo ""

# Lancer Firebase init
echo "🚀 Lancement de firebase init..."
echo "Suivez les instructions ci-dessus lors de la configuration"
echo ""

firebase init --project yaadha-dev
