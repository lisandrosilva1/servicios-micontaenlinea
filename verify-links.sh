#!/bin/bash

echo "🔍 Verificando enlaces internos..."
echo ""

# Verificar links en index.html
echo "📄 Links en index.html:"
grep -o 'href="[^"]*"' index.html | grep -E "(servicios|gracias)/" | sort -u

# Verificar links en servicios
echo -e "\n🔗 Links de servicios a gracias:"
for file in servicios/*.html; do
    service=$(basename "$file" .html)
    if grep -q "gracias/$service.html" "$file"; then
        echo "✓ $service -> gracias/$service.html"
    else
        echo "⚠ $service: No encontrado enlace a gracias"
    fi
done

# Verificar links a otros servicios
echo -e "\n🔗 Links entre servicios (en tarjetas relacionadas):"
grep -h "Ver Servicio" servicios/*.html | grep -o 'href="[^"]*"' | sort -u

echo -e "\n✅ Verificación completada"
