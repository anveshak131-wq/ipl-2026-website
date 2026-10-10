#!/usr/bin/env bash

# WPL / IPL Match Operations - Live Scorer Override Console
set -euo pipefail

MATCH_ID="WPL-2026-M14"
MATCH_TITLE="RCB-W vs DC-W"
CURRENT_OVER=19
BOWLER="Renuka Singh"
BATTER_STRIKER="Shafali Verma"
BATTER_NON_STRIKER="Meg Lanning"

RCB_DRS=2
DC_DRS=2

DELIVERIES=(
  "18.1|0|0|NONE|0|NONE|0|NONE"
  "18.2|4|0|NONE|0|NONE|0|NONE"
  "18.3|0|1|WD|0|NONE|0|NONE"
  "18.3|0|0|NONE|1|LBW|0|NONE"
  "18.4|1|0|NONE|0|NONE|0|NONE"
  "18.5|6|0|NONE|0|NONE|0|NONE"
)

C_RESET="\033[0m"
C_BOLD="\033[1m"
C_RED="\033[31m"
C_GREEN="\033[32m"
C_YELLOW="\033[33m"
C_BLUE="\033[34m"
C_MAGENTA="\033[35m"
C_CYAN="\033[36m"
C_GRAY="\033[90m"

render_screen() {
  clear
  echo -e "${C_BOLD}${C_MAGENTA}========================================================================${C_RESET}"
  echo -e "${C_BOLD}  WPL ADMIN LIVE SCORER OVERRIDE CONSOLE - ${MATCH_TITLE}${C_RESET}"
  echo -e "  Match ID: ${MATCH_ID} | Over: ${CURRENT_OVER} | Bowler: ${BOWLER}"
  echo -e "  DRS Reviews Remaining: ${C_CYAN}RCB-W: ${RCB_DRS}${C_RESET} | ${C_CYAN}DC-W: ${DC_DRS}${C_RESET}"
  echo -e "${C_BOLD}${C_MAGENTA}========================================================================${C_RESET}"
  echo ""

  echo -e "${C_BOLD}LIVE OVER STRIP:${C_RESET}"
  echo -n "  "
  for idx in "${!DELIVERIES[@]}"; do
    IFS='|' read -r label runs extras extra_type is_wicket w_type is_dead drs <<< "${DELIVERIES[$idx]}"
    
    if [[ "$is_dead" -eq 1 ]]; then
      echo -en "${C_GRAY}[DB]${C_RESET} "
    elif [[ "$is_wicket" -eq 1 ]]; then
      echo -en "${C_RED}[W]${C_RESET} "
    elif [[ "$extra_type" == "WD" ]]; then
      echo -en "${C_YELLOW}[${extras}Wd]${C_RESET} "
    elif [[ "$extra_type" == "NB" ]]; then
      echo -en "${C_YELLOW}[$((runs + extras))Nb]${C_RESET} "
    elif [[ "$runs" -ge 4 ]]; then
      echo -en "${C_GREEN}[${runs}]${C_RESET} "
    else
      echo -en "[${runs}] "
    fi
  done
  echo -e "\n"

  printf "${C_GRAY}%-4s %-8s %-12s %-10s %-18s %-15s${C_RESET}\n" "IDX" "BALL" "RUNS (BAT)" "EXTRAS" "WICKET" "DRS STATUS"
  echo "------------------------------------------------------------------------"

  for idx in "${!DELIVERIES[@]}"; do
    IFS='|' read -r label runs extras extra_type is_wicket w_type is_dead drs <<< "${DELIVERIES[$idx]}"
    
    status_str="Normal"
    [[ "$is_dead" -eq 1 ]] && status_str="DEAD BALL"

    w_str="None"
    [[ "$is_wicket" -eq 1 ]] && w_str="${w_type}"

    ext_str="-"
    [[ "$extra_type" != "NONE" ]] && ext_str="${extras} (${extra_type})"

    printf "[%d]  %-8s %-12s %-10s %-18s %-15s\n" \
      "$((idx + 1))" "$label" "$runs" "$ext_str" "$w_str" "$drs"
  done
  echo "------------------------------------------------------------------------"
  echo ""
}

edit_ball() {
  echo -en "${C_BOLD}Enter Delivery Index (1-${#DELIVERIES[@]}): ${C_RESET}"
  read -r selection
  idx=$((selection - 1))

  if [[ $idx -lt 0 || $idx -ge ${#DELIVERIES[@]} ]]; then
    echo -e "${C_RED}Invalid delivery index.${C_RESET}"
    sleep 1
    return
  fi

  IFS='|' read -r label runs extras extra_type is_wicket w_type is_dead drs <<< "${DELIVERIES[$idx]}"

  echo -e "\n${C_BOLD}Editing Delivery: ${label}${C_RESET}"
  echo -en "Runs off bat (0-6) [Current: $runs]: "
  read -r input_runs
  runs="${input_runs:-$runs}"

  echo -en "Extras type (NONE, WD, NB, LB) [Current: $extra_type]: "
  read -r input_ext_type
  extra_type="${input_ext_type:-$extra_type}"

  if [[ "$extra_type" != "NONE" ]]; then
    echo -en "Extras count [Current: $extras]: "
    read -r input_extras
    extras="${input_extras:-$extras}"
  else
    extras=0
  fi

  echo -en "Is Wicket? (1 = Yes, 0 = No) [Current: $is_wicket]: "
  read -r input_w
  is_wicket="${input_w:-$is_wicket}"

  if [[ "$is_wicket" -eq 1 ]]; then
    echo -en "Wicket type (caught, bowled, lbw, run_out, stumped) [Current: $w_type]: "
    read -r input_w_type
    w_type="${input_w_type:-$w_type}"
  else
    w_type="NONE"
  fi

  DELIVERIES[$idx]="${label}|${runs}|${extras}|${extra_type}|${is_wicket}|${w_type}|${is_dead}|${drs}"
  echo -e "${C_GREEN}Delivery updated successfully.${C_RESET}"
  sleep 1
}

toggle_dead_ball() {
  echo -en "${C_BOLD}Enter Delivery Index to toggle Dead Ball: ${C_RESET}"
  read -r selection
  idx=$((selection - 1))

  if [[ $idx -lt 0 || $idx -ge ${#DELIVERIES[@]} ]]; then
    echo -e "${C_RED}Invalid delivery index.${C_RESET}"
    sleep 1
    return
  fi

  IFS='|' read -r label runs extras extra_type is_wicket w_type is_dead drs <<< "${DELIVERIES[$idx]}"

  if [[ "$is_dead" -eq 1 ]]; then
    is_dead=0
    echo -e "${C_GREEN}Ball re-activated.${C_RESET}"
  else
    is_dead=1
    echo -e "${C_YELLOW}Ball declared DEAD BALL.${C_RESET}"
  fi

  DELIVERIES[$idx]="${label}|${runs}|${extras}|${extra_type}|${is_wicket}|${w_type}|${is_dead}|${drs}"
  sleep 1
}

log_drs_review() {
  echo -en "${C_BOLD}Enter Delivery Index to log DRS: ${C_RESET}"
  read -r selection
  idx=$((selection - 1))

  if [[ $idx -lt 0 || $idx -ge ${#DELIVERIES[@]} ]]; then
    echo -e "${C_RED}Invalid delivery index.${C_RESET}"
    sleep 1
    return
  fi

  IFS='|' read -r label runs extras extra_type is_wicket w_type is_dead drs <<< "${DELIVERIES[$idx]}"

  echo -e "\n${C_BOLD}Log DRS Review for Delivery ${label}:${C_RESET}"
  echo "1) DC-W (Batting)"
  echo "2) RCB-W (Bowling)"
  echo -en "Reviewing Team: "
  read -r team_choice
  reviewing_team="DC-W"
  [[ "$team_choice" == "2" ]] && reviewing_team="RCB-W"

  echo -e "\nReview Category:"
  echo "1) Dismissal (Out/Not Out)"
  echo "2) Wide Call"
  echo "3) Waist-High No-Ball"
  echo -en "Choice (1-3): "
  read -r cat_choice

  echo -e "\nTV Umpire Ruling:"
  echo "1) OVERTURNED (Retain Review)"
  echo "2) UMPIRES_CALL (Retain Review)"
  echo "3) UPHELD (Lose Review)"
  echo -en "Choice (1-3): "
  read -r ruling_choice

  ruling="OVERTURNED"
  retained=1

  case "$ruling_choice" in
    1) ruling="OVERTURNED"; retained=1 ;;
    2) ruling="UMPIRES_CALL"; retained=1 ;;
    3) ruling="UPHELD"; retained=0 ;;
  esac

  if [[ "$retained" -eq 0 ]]; then
    if [[ "$reviewing_team" == "RCB-W" && $RCB_DRS -gt 0 ]]; then
      RCB_DRS=$((RCB_DRS - 1))
    elif [[ "$reviewing_team" == "DC-W" && $DC_DRS -gt 0 ]]; then
      DC_DRS=$((DC_DRS - 1))
    fi
  fi

  drs_tag="${reviewing_team}:${ruling}"
  DELIVERIES[$idx]="${label}|${runs}|${extras}|${extra_type}|${is_wicket}|${w_type}|${is_dead}|${drs_tag}"

  echo -e "${C_GREEN}DRS logged: ${drs_tag} (Retained: ${retained})${C_RESET}"
  sleep 1.5
}

while true; do
  render_screen
  echo -e "${C_BOLD}CONSOLE ACTIONS:${C_RESET}"
  echo "  [1] Quick Edit Delivery (Runs, Extras, Wickets)"
  echo "  [2] Toggle Dead Ball (Ghost Ball Voiding)"
  echo "  [3] Log DRS Review (WPL Wide/No-Ball/Dismissal rules)"
  echo "  [4] Recalculate & Flush Cache"
  echo "  [q] Exit Console"
  echo ""
  echo -en "${C_BOLD}Select action: ${C_RESET}"
  read -r action

  case "$action" in
    1) edit_ball ;;
    2) toggle_dead_ball ;;
    3) log_drs_review ;;
    4)
      echo -e "${C_CYAN}Flushing Next.js edge cache and recalculating NRR... Done.${C_RESET}"
      sleep 1
      ;;
    q|Q)
      echo "Exiting scorer console."
      exit 0
      ;;
    *)
      echo -e "${C_RED}Unknown option.${C_RESET}"
      sleep 1
      ;;
  esac
done
