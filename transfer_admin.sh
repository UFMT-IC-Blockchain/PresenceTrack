#!/bin/bash

# Script para transferir admin do contrato owner-rules

echo "Transferindo admin do contrato owner-rules..."
echo "Contrato: CAOHH2TRQKPII3HHCFJUGK4LR5QECAT7OUFNKL3OKKOA6EXKTJ576463"
echo "Novo admin: GAPILR4XRM3HEYVGOVIP7NNXS4CKOHJDNIOM45TACPJ4CTMBA2RIBP5C"

# Comando para transferir admin
stellar contract invoke \
  --id CAOHH2TRQKPII3HHCFJUGK4LR5QECAT7OUFNKL3OKKOA6EXKTJ576463 \
  --source testnet-user \
  --network testnet \
  -- \
  transfer_admin \
  --new_admin GAPILR4XRM3HEYVGOVIP7NNXS4CKOHJDNIOM45TACPJ4CTMBA2RIBP5C