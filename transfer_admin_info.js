import { Address } from '@stellar/stellar-sdk';

// Configurar cliente para transferir admin
const OWNER_RULES_CONTRACT_ID = 'CAOHH2TRQKPII3HHCFJUGK4LR5QECAT7OUFNKL3OKKOA6EXKTJ576463';
const NEW_ADMIN_ADDRESS = 'GAPILR4XRM3HEYVGOVIP7NNXS4CKOHJDNIOM45TACPJ4CTMBA2RIBP5C';

console.log('=== Transferência de Admin do Contrato Owner-Rules ===');
console.log(`Contrato: ${OWNER_RULES_CONTRACT_ID}`);
console.log(`Novo Admin: ${NEW_ADMIN_ADDRESS}`);
console.log('');
console.log('Para transferir o admin, você precisa:');
console.log('1. Conectar sua wallet como admin atual no frontend');
console.log('2. Ir para a página Admin (http://localhost:5173/admin)');
console.log('3. Usar a função "transfer_admin" com o endereço:');
console.log(`   ${NEW_ADMIN_ADDRESS}`);
console.log('');
console.log('Ou execute este comando manualmente com a conta admin:');
console.log(`stellar contract invoke --id ${OWNER_RULES_CONTRACT_ID} --source <CONTA_ADMIN> --network testnet -- transfer_admin --new_admin ${NEW_ADMIN_ADDRESS}`);