-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 28/08/2026 às 19:46
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `academia_db`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_anamnese`
--

CREATE TABLE `avaliacao_anamnese` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `objetivos` text DEFAULT NULL,
  `pratica_atividade` text DEFAULT NULL,
  `medicamentos` text DEFAULT NULL,
  `cirurgia` text DEFAULT NULL,
  `doencas_familia` text DEFAULT NULL,
  `observacoes` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_cardiorrespiratoria`
--

CREATE TABLE `avaliacao_cardiorrespiratoria` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `condicao_fisica` varchar(20) NOT NULL,
  `protocolo_utilizado` varchar(50) NOT NULL,
  `frequencia_cardiaca_repouso` int(11) DEFAULT NULL,
  `vo2_max_obtido` decimal(5,2) DEFAULT 0.00,
  `vo2_max_previsto` decimal(5,2) DEFAULT 0.00,
  `deficit_aerobico_percentual` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_composicao`
--

CREATE TABLE `avaliacao_composicao` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `peso` decimal(5,2) NOT NULL,
  `altura` decimal(3,2) NOT NULL,
  `imc` decimal(5,2) DEFAULT NULL,
  `tmb` decimal(7,2) DEFAULT NULL,
  `protocolo` varchar(50) DEFAULT 'JACKSON_POLLOCK_3',
  `dobra_tricipital` decimal(5,2) DEFAULT NULL,
  `dobra_subescapular` decimal(5,2) DEFAULT NULL,
  `dobra_suprailiaca` decimal(5,2) DEFAULT NULL,
  `dobra_coxa` decimal(5,2) DEFAULT NULL,
  `dobra_abdominal` decimal(5,2) DEFAULT NULL,
  `dobra_peitoral` decimal(5,2) DEFAULT NULL,
  `dobra_axilar_media` decimal(5,2) DEFAULT NULL,
  `percentual_gordura` decimal(5,2) DEFAULT NULL,
  `massa_magra_kg` decimal(5,2) DEFAULT NULL,
  `massa_gorda_kg` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_fisica`
--

CREATE TABLE `avaliacao_fisica` (
  `id` bigint(20) NOT NULL,
  `aluno_id` bigint(20) NOT NULL,
  `professor_id` bigint(20) NOT NULL,
  `numero_avaliacao` int(11) NOT NULL DEFAULT 1,
  `data_avaliacao` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_neuromotores`
--

CREATE TABLE `avaliacao_neuromotores` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `flexao_bracos_reps` int(11) DEFAULT 0,
  `abdominal_reps` int(11) DEFAULT 0,
  `banco_wells_cm` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_perimetros`
--

CREATE TABLE `avaliacao_perimetros` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `ombro` decimal(5,2) DEFAULT NULL,
  `braco_relaxado_dir` decimal(5,2) DEFAULT NULL,
  `braco_relaxado_esq` decimal(5,2) DEFAULT NULL,
  `braco_contraido_dir` decimal(5,2) DEFAULT NULL,
  `braco_contraido_esq` decimal(5,2) DEFAULT NULL,
  `antebraco_dir` decimal(5,2) DEFAULT NULL,
  `antebraco_esq` decimal(5,2) DEFAULT NULL,
  `torax_relaxado` decimal(5,2) DEFAULT NULL,
  `torax_inspirado` decimal(5,2) DEFAULT NULL,
  `cintura` decimal(5,2) DEFAULT NULL,
  `abdome` decimal(5,2) DEFAULT NULL,
  `quadril` decimal(5,2) DEFAULT NULL,
  `coxa_dir` decimal(5,2) DEFAULT NULL,
  `coxa_esq` decimal(5,2) DEFAULT NULL,
  `panturrilha_dir` decimal(5,2) DEFAULT NULL,
  `panturrilha_esq` decimal(5,2) DEFAULT NULL,
  `rcq_resultado` decimal(5,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `avaliacao_risco_coronariano`
--

CREATE TABLE `avaliacao_risco_coronariano` (
  `id` bigint(20) NOT NULL,
  `avaliacao_id` bigint(20) NOT NULL,
  `idade` int(11) NOT NULL,
  `sexo` char(1) NOT NULL,
  `exercicio_fisico` varchar(50) NOT NULL,
  `historico_familiar` varchar(50) NOT NULL,
  `tabagismo` varchar(50) NOT NULL,
  `pontuacao_total` int(11) DEFAULT 0,
  `classificacao_risco` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pagamentos`
--

CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_pagamento` date NOT NULL,
  `status` enum('PAGO','PENDENTE','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  `mes_referencia` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `treinos`
--

CREATE TABLE `treinos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `titulo` varchar(100) NOT NULL,
  `descricao` text NOT NULL,
  `dia_semana` varchar(50) DEFAULT 'Geral',
  `data_criacao` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `matricula` varchar(10) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `telefone` varchar(20) NOT NULL,
  `data_nascimento` date NOT NULL,
  `foto_url` longtext DEFAULT NULL,
  `data_cadastro` date NOT NULL DEFAULT curdate(),
  `data_vencimento` date NOT NULL,
  `agendar_aula_experimental` datetime DEFAULT NULL,
  `realizou_avaliacao` tinyint(1) DEFAULT 0,
  `tipo_usuario` tinyint(4) NOT NULL DEFAULT 3 COMMENT '1: Admin, 2: Professor, 3: Aluno'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `avaliacao_anamnese`
--
ALTER TABLE `avaliacao_anamnese`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `avaliacao_cardiorrespiratoria`
--
ALTER TABLE `avaliacao_cardiorrespiratoria`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `avaliacao_composicao`
--
ALTER TABLE `avaliacao_composicao`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `avaliacao_fisica`
--
ALTER TABLE `avaliacao_fisica`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_aluno` (`aluno_id`),
  ADD KEY `idx_professor` (`professor_id`);

--
-- Índices de tabela `avaliacao_neuromotores`
--
ALTER TABLE `avaliacao_neuromotores`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `avaliacao_perimetros`
--
ALTER TABLE `avaliacao_perimetros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `avaliacao_risco_coronariano`
--
ALTER TABLE `avaliacao_risco_coronariano`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `avaliacao_id` (`avaliacao_id`),
  ADD UNIQUE KEY `avaliacao_id_2` (`avaliacao_id`);

--
-- Índices de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `treinos`
--
ALTER TABLE `treinos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `avaliacao_anamnese`
--
ALTER TABLE `avaliacao_anamnese`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_cardiorrespiratoria`
--
ALTER TABLE `avaliacao_cardiorrespiratoria`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_composicao`
--
ALTER TABLE `avaliacao_composicao`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_fisica`
--
ALTER TABLE `avaliacao_fisica`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_neuromotores`
--
ALTER TABLE `avaliacao_neuromotores`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_perimetros`
--
ALTER TABLE `avaliacao_perimetros`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `avaliacao_risco_coronariano`
--
ALTER TABLE `avaliacao_risco_coronariano`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `treinos`
--
ALTER TABLE `treinos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `avaliacao_anamnese`
--
ALTER TABLE `avaliacao_anamnese`
  ADD CONSTRAINT `fk_anamnese_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `avaliacao_cardiorrespiratoria`
--
ALTER TABLE `avaliacao_cardiorrespiratoria`
  ADD CONSTRAINT `fk_cardio_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `avaliacao_composicao`
--
ALTER TABLE `avaliacao_composicao`
  ADD CONSTRAINT `fk_composicao_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `avaliacao_neuromotores`
--
ALTER TABLE `avaliacao_neuromotores`
  ADD CONSTRAINT `fk_neuromotores_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `avaliacao_perimetros`
--
ALTER TABLE `avaliacao_perimetros`
  ADD CONSTRAINT `fk_perimetros_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `avaliacao_risco_coronariano`
--
ALTER TABLE `avaliacao_risco_coronariano`
  ADD CONSTRAINT `fk_risco_avaliacao` FOREIGN KEY (`avaliacao_id`) REFERENCES `avaliacao_fisica` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `treinos`
--
ALTER TABLE `treinos`
  ADD CONSTRAINT `treinos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
