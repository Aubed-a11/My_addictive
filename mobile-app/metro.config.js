const { getDefaultConfig } = require('expo/metro-config');

/**
 * Limite le nombre de processus de transformation paralleles ("workers") de
 * Metro. Par defaut, Metro lance un worker par coeur de processeur
 * disponible : sur une machine qui fait deja tourner 10 microservices Java
 * + une base H2 par service en meme temps que le bundler, ca peut saturer
 * la memoire disponible et provoquer un crash "Fatal process out of memory"
 * en plein empaquetage. Une valeur plus basse est plus lente a bundler mais
 * beaucoup plus fiable dans ce contexte.
 */
const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;

module.exports = config;
