import { Address } from '@stellar/stellar-sdk';

// Importar o cliente do contrato owner_rules
import ownerRules from './src/contracts/owner_rules.ts';

const NEW_ADMIN_ADDRESS = 'GAPILR4XRM3HEYVGOVIP7NNXS4CKOHJDNIOM45TACPJ4CTMBA2RIBP5C';

async function transferAdmin() {
  try {
    console.log('Iniciando transferência de admin...');
    console.log(`Contrato atual: ${ownerRules.options.contractId}`);
    console.log(`Novo admin: ${NEW_ADMIN_ADDRESS}`);
    
    // Enviar transação de transferência
    const tx = await ownerRules.transfer_admin({
      new_admin: NEW_ADMIN_ADDRESS
    });
    
    console.log('Transação preparada:', tx);
    
    // Assinar e enviar a transação
    const result = await tx.signAndSend();
    console.log('Transferência concluída com sucesso!');
    console.log('Resultado:', result);
    
  } catch (error) {
    console.error('Erro ao transferir admin:', error);
  }
}

transferAdmin();