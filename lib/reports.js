'use strict';

function validation(receipt, spec, pt) {
  const states = pt ? { passed: 'atendido', failed: 'falhou', partial: 'parcial', limited: 'verificação externa pendente', deferred: 'adiado', not_run: 'não executado', blocked: 'bloqueado', not_applicable: 'não aplicável' } : {};
  const state = value => states[value] || value;
  const methods = pt ? { automated: 'automatizado', manual: 'manual', inspection: 'inspeção' } : {};
  const count = result => receipt.criteria.filter(item => item.result === result).length;
  return [
    (pt ? '# Validação — ' : '# Validation — ') + spec.id, '',
    (pt ? '**Situação:** ' : '**Status:** ') + state(receipt.verdict) + '.',
    (pt ? '**Aceitação integral verificada:** ' : '**Acceptance fully verified:** ') + (receipt.acceptance_verified ? pt ? 'sim' : 'yes' : pt ? 'não' : 'no') + '.', '',
    (pt ? 'Critérios: ' : 'Criteria: ') + count('passed') + (pt ? ' atendidos; ' : ' passed; ') + count('failed') + (pt ? ' com falha; ' : ' failed; ') + (receipt.criteria.length - count('passed') - count('failed')) + (pt ? ' pendentes ou não aplicáveis.' : ' pending or not applicable.'), '',
    pt ? '## Critérios de aceitação' : '## Acceptance criteria', '',
    pt ? '| Critério | Método | Resultado |' : '| Criterion | Method | Result |', '|---|---|---|',
    ...receipt.criteria.map(item => '| ' + item.id + ' | ' + (methods[item.method] || item.method) + ' | ' + state(item.result) + ' |'), '',
    pt ? '## Verificações executadas' : '## Executed checks', '',
    ...receipt.checks.map(item => '- ' + item.name + ': ' + state(item.result) + (item.executed ? (pt ? '; saída ' : '; exit ') + item.exit_code : pt ? '; não executado' : '; not executed') + '.'), '',
    ...(receipt.pending_verification.length ? [pt ? '## Próximos passos' : '## Next steps', '',
      pt ? 'Consulte [USER_TESTS.md](USER_TESTS.md) para os passos, responsáveis e pré-requisitos pendentes. Implementação local não equivale à conclusão da aceitação.'
        : 'See [USER_TESTS.md](USER_TESTS.md) for pending steps, owners and prerequisites. Local implementation does not mean acceptance is complete.', ''] : []),
    ...receipt.warnings.map(item => '- ' + item), '',
    pt ? '## Registro técnico local' : '## Local technical record', '',
    '`' + (spec.change.storage === 'private' ? '.sdd/' : '') + 'runs/' + receipt.run_id + '/receipt.json`', '',
    pt ? 'Revise o comportamento e as asserções dos testes. Um comando aprovado não comprova sozinho a cobertura semântica; este relatório não autoriza deploy.'
      : 'Review behavior and test assertions. Passing commands alone do not prove semantic coverage; this report does not authorize deployment.',
  ].join('\n');
}

module.exports = { validation };
