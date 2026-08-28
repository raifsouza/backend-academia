import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method === 'GET') {
        const { matricula, aluno_id } = req.query;

        if (!matricula && !aluno_id) {
            return res.status(400).json({ error: 'Informe a matrícula ou id do aluno.' });
        }

        try {
            let targetAlunoId = aluno_id;

            if (matricula) {
                const [alunoRows]: any = await db.query(
                    `SELECT id FROM usuarios WHERE matricula = ?`,
                    [String(matricula).trim()]
                );

                if (alunoRows.length === 0) {
                    return res.status(404).json({ error: 'Aluno não encontrado com a matrícula informada.' });
                }
                targetAlunoId = alunoRows[0].id;
            }

            const [avaliacoes]: any = await db.query(
                `SELECT * FROM avaliacao_fisica WHERE aluno_id = ? ORDER BY numero_avaliacao DESC`,
                [targetAlunoId]
            );

            if (avaliacoes.length === 0) {
                return res.status(200).json([]);
            }

            const resultadoCompleto = await Promise.all(
                avaliacoes.map(async (avaliacao: any) => {
                    const avaliacaoId = avaliacao.id;

                    const [anamnese]: any = await db.query(`SELECT * FROM avaliacao_anamnese WHERE avaliacao_id = ?`, [avaliacaoId]);
                    const [risco]: any = await db.query(`SELECT * FROM avaliacao_risco_coronariano WHERE avaliacao_id = ?`, [avaliacaoId]);
                    const [perimetros]: any = await db.query(`SELECT * FROM avaliacao_perimetros WHERE avaliacao_id = ?`, [avaliacaoId]);
                    const [composicao]: any = await db.query(`SELECT * FROM avaliacao_composicao WHERE avaliacao_id = ?`, [avaliacaoId]);
                    const [cardio]: any = await db.query(`SELECT * FROM avaliacao_cardiorrespiratoria WHERE avaliacao_id = ?`, [avaliacaoId]);
                    const [neuromotores]: any = await db.query(`SELECT * FROM avaliacao_neuromotores WHERE avaliacao_id = ?`, [avaliacaoId]);

                    return {
                        ...avaliacao,
                        anamnese: anamnese[0] || null,
                        risco_coronariano: risco[0] || null,
                        perimetros: perimetros[0] || null,
                        composicao: composicao[0] || null,
                        cardiorrespiratoria: cardio[0] || null,
                        neuromotores: neuromotores[0] || null,
                    };
                })
            );

            return res.status(200).json(resultadoCompleto);

        } catch (error) {
            console.error('Erro ao buscar avaliação física:', error);
            return res.status(500).json({ error: 'Erro interno ao consultar avaliações físicas.' });
        }
    }

    if (req.method === 'POST') {
        const {
            id,
            aluno_id,
            professor_id,
            numero_avaliacao,
            data_avaliacao,
            anamnese,
            risco_coronariano,
            perimetros,
            composicao,
            cardiorrespiratoria,
            neuromotores
        } = req.body;

        if (!aluno_id || !professor_id) {
            return res.status(400).json({ error: 'Os campos aluno_id e professor_id são obrigatórios.' });
        }

        try {
            let avaliacaoId = id;
            const dataFormatada = data_avaliacao ? new Date(data_avaliacao).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);

            // --- 1. TABELA PRINCIPAL ---
            if (avaliacaoId) {
                await db.query(
                    `UPDATE avaliacao_fisica 
                     SET numero_avaliacao = ?, data_avaliacao = ?, professor_id = ? 
                     WHERE id = ?`,
                    [numero_avaliacao || 1, dataFormatada, professor_id, avaliacaoId]
                );
            } else {
                const [result]: any = await db.query(
                    `INSERT INTO avaliacao_fisica (aluno_id, professor_id, numero_avaliacao, data_avaliacao) 
                     VALUES (?, ?, ?, ?)`,
                    [aluno_id, professor_id, numero_avaliacao || 1, dataFormatada]
                );
                avaliacaoId = result.insertId;
            }

            // --- 2. ABA ANAMNESE ---
            if (anamnese) {
                await db.query(
                    `INSERT INTO avaliacao_anamnese 
                        (avaliacao_id, objetivos, pratica_atividade, medicamentos, cirurgia, doencas_familia, observacoes)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        objetivos = VALUES(objetivos),
                        pratica_atividade = VALUES(pratica_atividade),
                        medicamentos = VALUES(medicamentos),
                        cirurgia = VALUES(cirurgia),
                        doencas_familia = VALUES(doencas_familia),
                        observacoes = VALUES(observacoes)`,
                    [
                        avaliacaoId,
                        anamnese.objetivos || null,
                        anamnese.pratica_atividade || null,
                        anamnese.medicamentos || null,
                        anamnese.cirurgia || null,
                        anamnese.doencas_familia || null,
                        anamnese.observacoes || null
                    ]
                );
            }

            // --- 3. ABA RISCO CORONARIANO ---
            if (risco_coronariano) {
                await db.query(
                    `INSERT INTO avaliacao_risco_coronariano 
                        (avaliacao_id, idade, sexo, exercicio_fisico, historico_familiar, tabagismo, pontuacao_total, classificacao_risco)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        idade = VALUES(idade),
                        sexo = VALUES(sexo),
                        exercicio_fisico = VALUES(exercicio_fisico),
                        historico_familiar = VALUES(historico_familiar),
                        tabagismo = VALUES(tabagismo),
                        pontuacao_total = VALUES(pontuacao_total),
                        classificacao_risco = VALUES(classificacao_risco)`,
                    [
                        avaliacaoId,
                        risco_coronariano.idade || 0,
                        risco_coronariano.sexo || 'M',
                        risco_coronariano.exercicio_fisico || '',
                        risco_coronariano.historico_familiar || '',
                        risco_coronariano.tabagismo || '',
                        risco_coronariano.pontuacao_total || 0,
                        risco_coronariano.classificacao_risco || ''
                    ]
                );
            }

            // --- 4. ABA PERÍMETROS ---
            if (perimetros) {
                let rcq = null;
                if (perimetros.cintura && perimetros.quadril && Number(perimetros.quadril) > 0) {
                    rcq = (Number(perimetros.cintura) / Number(perimetros.quadril)).toFixed(2);
                }

                // Extração segura das dobras Cutâneas que estão dentro de composicao.dobras
                const dobras = composicao?.dobras || {};

                // Aceita tanto 'antebraaco_dir' quanto 'antebraco_dir'
                const antebracoDir = perimetros?.antebraaco_dir ?? perimetros?.antebraco_dir ?? null;
                const antebracoEsq = perimetros?.antebraaco_esq ?? perimetros?.antebraco_esq ?? null;

                await db.query(
                    `INSERT INTO avaliacao_perimetros 
                        (avaliacao_id, ombro, braco_relaxado_dir, braco_relaxado_esq, braco_contraido_dir, braco_contraido_esq, antebraco_dir, antebraco_esq, torax_relaxado, torax_inspirado, cintura, abdome, quadril, coxa_dir, coxa_esq, panturrilha_dir, panturrilha_esq, rcq_resultado)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        ombro = VALUES(ombro), braco_relaxado_dir = VALUES(braco_relaxado_dir), braco_relaxado_esq = VALUES(braco_relaxado_esq),
                        braco_contraido_dir = VALUES(braco_contraido_dir), braco_contraido_esq = VALUES(braco_contraido_esq),
                        antebraco_dir = VALUES(antebraco_dir), antebraco_esq = VALUES(antebraco_esq), torax_relaxado = VALUES(torax_relaxado),
                        torax_inspirado = VALUES(torax_inspirado), cintura = VALUES(cintura), abdome = VALUES(abdome), quadril = VALUES(quadril),
                        coxa_dir = VALUES(coxa_dir), coxa_esq = VALUES(coxa_esq), panturrilha_dir = VALUES(panturrilha_dir), panturrilha_esq = VALUES(panturrilha_esq), rcq_resultado = VALUES(rcq_resultado)`,
                    [
                        avaliacaoId,
                        perimetros.ombro || null, perimetros.braco_relaxado_dir || null, perimetros.braco_relaxado_esq || null,
                        perimetros.braco_contraido_dir || null, perimetros.braco_contraido_esq || null, antebracoDir,
                        antebracoEsq, perimetros.torax_relaxado || null, perimetros.torax_inspirado || null,
                        perimetros.cintura || null, perimetros.abdome || null, perimetros.quadril || null, perimetros.coxa_dir || null,
                        perimetros.coxa_esq || null, perimetros.panturrilha_dir || null, perimetros.panturrilha_esq || null, rcq
                    ]
                );
            }

            // --- 5. ABA COMPOSIÇÃO CORPORAL ---
            if (composicao) {
                let imc = null;
                if (composicao.peso && composicao.altura && Number(composicao.altura) > 0) {
                    const alt = Number(composicao.altura);
                    imc = (Number(composicao.peso) / (alt * alt)).toFixed(2);
                }

                await db.query(
                    `INSERT INTO avaliacao_composicao 
                        (avaliacao_id, peso, altura, imc, tmb, protocolo, dobra_tricipital, dobra_subescapular, dobra_suprailiaca, dobra_coxa, dobra_abdominal, dobra_peitoral, dobra_axilar_media, percentual_gordura, massa_magra_kg, massa_gorda_kg)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        peso = VALUES(peso), altura = VALUES(altura), imc = VALUES(imc), tmb = VALUES(tmb), protocolo = VALUES(protocolo),
                        dobra_tricipital = VALUES(dobra_tricipital), dobra_subescapular = VALUES(dobra_subescapular), dobra_suprailiaca = VALUES(dobra_suprailiaca),
                        dobra_coxa = VALUES(dobra_coxa), dobra_abdominal = VALUES(dobra_abdominal), dobra_peitoral = VALUES(dobra_peitoral),
                        dobra_axilar_media = VALUES(dobra_axilar_media), percentual_gordura = VALUES(percentual_gordura),
                        massa_magra_kg = VALUES(massa_magra_kg), massa_gorda_kg = VALUES(massa_gorda_kg)`,
                    [
                        avaliacaoId,
                        composicao.peso || 0, composicao.altura || 0, imc, composicao.tmb || null,
                        composicao.protocolo || 'JACKSON_POLLOCK_3', composicao.dobra_tricipital || null,
                        composicao.dobra_subescapular || null, composicao.dobra_suprailiaca || null,
                        composicao.dobra_coxa || null, composicao.dobra_abdominal || null,
                        composicao.dobra_peitoral || null, composicao.dobra_axilar_media || null,
                        composicao.percentual_gordura || null, composicao.massa_magra_kg || null,
                        composicao.massa_gorda_kg || null
                    ]
                );
            }

            // --- 6. ABA CARDIORRESPIRATÓRIA ---
            if (cardiorrespiratoria) {
                await db.query(
                    `INSERT INTO avaliacao_cardiorrespiratoria 
                        (avaliacao_id, condicao_fisica, protocolo_utilizado, frequencia_cardiaca_repouso, vo2_max_obtido, vo2_max_previsto, deficit_aerobico_percentual)
                     VALUES (?, ?, ?, ?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        condicao_fisica = VALUES(condicao_fisica), protocolo_utilizado = VALUES(protocolo_utilizado),
                        frequencia_cardiaca_repouso = VALUES(frequencia_cardiaca_repouso), vo2_max_obtido = VALUES(vo2_max_obtido),
                        vo2_max_previsto = VALUES(vo2_max_previsto), deficit_aerobico_percentual = VALUES(deficit_aerobico_percentual)`,
                    [
                        avaliacaoId,
                        cardiorrespiratoria.condicao_fisica || 'SEDENTARIO',
                        cardiorrespiratoria.protocolo_utilizado || '',
                        cardiorrespiratoria.frequencia_cardiaca_repouso || null,
                        cardiorrespiratoria.vo2_max_obtido || 0,
                        cardiorrespiratoria.vo2_max_previsto || 0,
                        cardiorrespiratoria.deficit_aerobico_percentual || 0
                    ]
                );
            }

            // --- 7. ABA NEUROMOTORES ---
            if (neuromotores) {
                await db.query(
                    `INSERT INTO avaliacao_neuromotores 
                        (avaliacao_id, flexao_bracos_reps, abdominal_reps, banco_wells_cm)
                     VALUES (?, ?, ?, ?)
                     ON DUPLICATE KEY UPDATE 
                        flexao_bracos_reps = VALUES(flexao_bracos_reps),
                        abdominal_reps = VALUES(abdominal_reps),
                        banco_wells_cm = VALUES(banco_wells_cm)`,
                    [
                        avaliacaoId,
                        neuromotores.flexao_bracos_reps || 0,
                        neuromotores.abdominal_reps || 0,
                        neuromotores.banco_wells_cm || 0
                    ]
                );
            }

            return res.status(200).json({
                message: 'Avaliação física salva com sucesso!',
                avaliacao_id: avaliacaoId
            });

        } catch (error: any) {
            console.error('Erro detalhado ao salvar avaliação:', error);
            return res.status(500).json({ 
                error: 'Erro interno ao tentar salvar a avaliação física.',
                details: error.message || error 
            });
        }
    }

    return res.status(405).json({ error: 'Método não permitido.' });
}