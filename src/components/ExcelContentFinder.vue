<template>
  <div class="excel-content-finder">
    <h2>Excel 内容查找器</h2>
    
    <div class="server-status-container">
    <div class="server-status" :class="{ 'connected': serverConnected }">
      服务器状态: {{ serverConnected ? '已连接' : '未连接' }}
      </div>
      <el-tooltip content="API配置设置" placement="bottom">
        <el-button 
          type="primary"
          icon="el-icon-setting" 
          @click="showApiConfig = true"
          circle
          size="small"
          class="api-config-button"
        ></el-button>
      </el-tooltip>
    </div>
    
    <!-- API配置对话框 -->
    <el-dialog
      title="API配置"
      :visible.sync="showApiConfig"
      width="500px"
      @open="onConfigDialogOpen"
    >
      <el-alert
        v-if="apiErrorMessage"
        title="API连接错误"
        type="error"
        description="当前API配置可能无效，请检查并更新配置信息。"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      >
        <div class="error-details">{{ apiErrorMessage }}</div>
      </el-alert>
      
      <el-form :model="apiConfig" label-width="120px">
        <el-form-item label="API地址" required>
          <el-input v-model="apiConfig.apiUrl" placeholder="例如: https://www.sophnet.com/api/open-apis/v1/chat/completions">
            <template slot="prepend">
              <el-tooltip content="API地址应为SophNet官方提供的完整URL" placement="top">
                <i class="el-icon-info"></i>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="API密钥" required>
          <el-input 
            v-model="apiConfig.apiKey" 
            placeholder="输入您的API密钥"
            :type="showApiKey ? 'text' : 'password'"
          >
            <template slot="prepend">
              <el-tooltip content="API密钥应为SophNet平台生成的密钥，不包含额外空格" placement="top">
                <i class="el-icon-info"></i>
              </el-tooltip>
            </template>
            <el-button 
              slot="append" 
              icon="el-icon-view" 
              @click="showApiKey = !showApiKey"
            ></el-button>
          </el-input>
          <div class="form-tip">注意：授权格式为 "Bearer API密钥"，请确保API密钥无多余空格</div>
        </el-form-item>
        <el-form-item label="模型名称">
          <el-select v-model="apiConfig.model" placeholder="请选择模型">
            <el-option
              v-for="item in modelOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            </el-option>
          </el-select>
          <div class="form-tip">SophNet API仅支持max_tokens参数，其他超参数如temperature在此模型中不支持</div>
        </el-form-item>
        <el-form-item label="最大Token数">
          <el-slider
            v-model="apiConfig.maxTokens"
            :min="1000"
            :max="32768"
            :step="100"
            show-input
            :show-input-controls="false"
            input-size="mini"
          ></el-slider>
          <div class="form-tip">建议值：32768 (SophNet推荐最大值)</div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resetApiConfig" type="info" plain>重置</el-button>
        <el-button @click="showApiConfig = false">取消</el-button>
        <el-button type="primary" @click="saveApiConfig" :loading="saveConfigLoading">保存配置</el-button>
        <el-button type="success" @click="testApiConnection" :loading="testApiLoading">测试连接</el-button>
      </div>
    </el-dialog>
    
    <!-- 分析方式说明 -->
    <div class="analysis-method-info">
      <el-collapse>
        <el-collapse-item title="关于分析方式">
          <p>本系统使用以下方式分析Excel文件:</p>
          <ol>
            <li>上传Excel文件到服务器</li>
            <li>使用XLSX库读取文件内容和结构</li>
            <li>按行提取工作表中的文本数据</li>
            <li>进行两种层次的分析：
              <ul>
                <li>基本匹配：直接搜索文本内容中是否包含搜索词</li>
                <li>语义分析：通过SophNet AI (DeepSeek-R1/v3系列模型)分析文本内容与搜索内容的语义相关度</li>
              </ul>
            </li>
            <li>返回0-100的相关度分数和具体匹配位置</li>
            <li>根据分数和匹配项提供文件相关性排序和建议</li>
          </ol>
          <div class="api-info">
            <p><strong>API技术说明：</strong></p>
            <p>本系统使用SophNet API进行语义分析，其中：</p>
            <ul>
              <li>支持DeepSeek-R1、DeepSeek-v3等大语言模型</li>
              <li>使用最大Token限制控制API请求消耗</li>
              <li>采用智能分析优化策略：
                <ul>
                  <li>当文件中有大量直接匹配(>5处)时，自动跳过API调用，节约Token</li>
                  <li>分析时只提取必要的文本片段(最多1000字符)，降低处理负担</li>
                  <li>支持限制批处理文件数量，避免超时错误</li>
                </ul>
              </li>
              <li>通过Bearer认证方式进行API调用</li>
            </ul>
          </div>
          <p class="small-text">注: 分析仅针对Excel中的文本内容，暂不支持图表、图片等非文本元素的分析</p>
        </el-collapse-item>
      </el-collapse>
    </div>
    
    <!-- 文件选择区域 -->
    <div class="folder-selection-section">
      <el-button @click="$refs.folderInput.click()" :disabled="loading">
        选择本地文件夹
      </el-button>
      <span v-if="selectedFiles.length > 0" class="selected-files-info">
        已选择 {{ selectedFiles.length }} 个Excel文件
        <el-tooltip content="选择过多文件可能导致处理时间过长" placement="top" v-if="selectedFiles.length > 10">
          <i class="el-icon-warning" style="color: #E6A23C;"></i>
        </el-tooltip>
      </span>
      <input 
        ref="folderInput" 
        type="file" 
        webkitdirectory 
        multiple 
        style="display: none" 
        @change="handleFolderSelection" 
      />
    </div>
    
    <div class="search-section">
      <el-input
        v-model="searchContent"
        placeholder="请输入要在所选文件中查找的内容"
        class="search-input"
        clearable
        @keyup.enter="startBatchAnalysis"
        :disabled="loading"
      />
      <el-button 
        type="primary" 
        @click="startBatchAnalysis" 
        :loading="loading" 
        :disabled="!serverConnected || !searchContent || selectedFiles.length === 0 || loading">
        {{ loading ? '分析中...' : '分析' }}
      </el-button>
      <el-button 
        type="text" 
        @click="showAdvancedOptions = !showAdvancedOptions" 
        :disabled="loading">
        高级选项
        <i :class="showAdvancedOptions ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
      </el-button>
    </div>

    <!-- 高级选项 -->
    <el-collapse-transition>
      <div v-if="showAdvancedOptions" class="advanced-options">
        <el-card>
          <div slot="header" class="clearfix">
            <span>高级搜索选项</span>
          </div>
          <el-form label-position="left" label-width="140px" size="small">
            <el-form-item label="内容理解模式">
              <el-select v-model="searchOptions.understandingMode" style="width: 100%">
                <el-option label="智能语义理解 (更理解意图)" value="semantic" />
                <el-option label="精确匹配 (更关注关键词)" value="exact" />
                <el-option label="平衡模式 (结合两种方法)" value="balanced" />
              </el-select>
            </el-form-item>
            
            <el-form-item label="最低相关度阈值">
              <el-slider 
                v-model="searchOptions.minRelevanceThreshold"
                :min="0"
                :max="100"
                :step="5"
                :format-tooltip="value => `${value}%`"
                show-stops
                show-input
              />
            </el-form-item>
            
            <el-form-item label="分析深度">
              <el-radio-group v-model="searchOptions.analysisDepth">
                <el-radio label="shallow">浅层 (速度快，仅分析匹配区域)</el-radio>
                <el-radio label="deep">深层 (更全面，分析更多内容)</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </el-collapse-transition>

    <!-- 批量处理配置 -->
    <div class="batch-process-settings" v-if="selectedFiles.length > 5">
      <el-alert
        title="处理优化设置"
        type="info"
        :closable="false"
        show-icon
      >
        <div>
          <span>每批处理文件数量：</span>
          <el-select v-model="batchSizeLimit" size="small" style="width: 120px;" :disabled="loading">
            <el-option :value="5" label="5 个"></el-option>
            <el-option :value="10" label="10 个"></el-option>
            <el-option :value="20" label="20 个"></el-option>
            <el-option :value="50" label="50 个"></el-option>
            <el-option :value="0" label="不限制"></el-option>
          </el-select>
          <el-tooltip content="限制一次处理的文件数量，可减少请求超时风险" placement="right">
            <i class="el-icon-question" style="margin-left: 5px;"></i>
          </el-tooltip>
        </div>
      </el-alert>
    </div>

    <!-- 批次处理进度 -->
    <div v-if="batchProcessInfo.enabled" class="batch-process-info">
      <el-alert
        :title="`批次处理进度: ${batchProcessInfo.currentBatch}/${batchProcessInfo.totalBatches}`"
        type="success"
        :closable="false"
        show-icon
      >
        <div>
          <el-progress 
            :percentage="batchProcessInfo.percentage" 
            :text-inside="true" 
            :stroke-width="18"
            :status="batchProcessInfo.currentBatch === batchProcessInfo.totalBatches ? 'success' : 'warning'"
          ></el-progress>
          <div class="batch-process-stats">
            <span>已处理: {{batchProcessInfo.processedFiles}} 个文件</span>
            <span>总计: {{batchProcessInfo.totalFiles}} 个文件</span>
            <span v-if="batchProcessInfo.processedFiles < batchProcessInfo.totalFiles && !loading">
              <el-button size="mini" type="primary" @click="continueNextBatch">继续下一批</el-button>
            </span>
          </div>
        </div>
      </el-alert>
    </div>

    <!-- 状态区域 -->
    <div v-if="loading || analysisLogs.length > 0" class="status-section">
      <el-collapse v-model="processCollapse">
        <el-collapse-item name="process">
          <template slot="title">
            <span v-if="loading">正在分析文件中，请耐心等待...</span>
            <span v-else>分析已完成 ({{ searchResults.length }} 个结果)</span>
          </template>
          <div>
            <el-progress 
              v-if="loading && analysisProgress.total > 0" 
              :percentage="analysisProgressPercentage" 
              :text-inside="true" 
              :stroke-width="20"
              style="margin-top: 10px; margin-bottom: 15px;">
              <span>{{ analysisProgress.processed }} / {{ analysisProgress.total }} 文件</span>
            </el-progress>
            
            <!-- 分析日志 -->
            <div v-if="analysisLogs.length > 0" class="analysis-logs">
              <div class="log-header">
                <span>分析日志</span>
                <el-button 
                  type="text" 
                  size="mini" 
                  @click="clearAnalysisLogs"
                  v-if="!loading">
                  清除日志
                </el-button>
              </div>
              <div class="log-container">
                <div 
                  v-for="(log, index) in analysisLogs" 
                  :key="index" 
                  class="log-item"
                  :class="{'log-error': log.type === 'error', 'log-success': log.type === 'success'}">
                  <span class="log-time">{{ log.time }}</span>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 文件列表 -->
    <div v-if="selectedFiles.length > 0" class="file-list-section">
      <el-collapse v-model="fileListCollapse">
        <el-collapse-item name="fileList">
          <template slot="title">
            <h3 style="margin: 0">已选择的文件 ({{ selectedFiles.length }})</h3>
          </template>
          <el-table :data="selectedFilesTable" style="width: 100%" height="200" max-height="200">
            <el-table-column prop="name" label="文件名">
              <template slot-scope="scope">
                <el-tooltip :content="scope.row.name" placement="top" :disabled="scope.row.name.length < 30">
                  <span>{{ scope.row.name }}</span>
                </el-tooltip>
              </template>
            </el-table-column>
            <el-table-column prop="size" label="大小" width="120" />
          </el-table>
        </el-collapse-item>
      </el-collapse>
    </div>

    <!-- 结果区域 -->
    <div class="results-section" v-if="searchResults.length > 0">
      <h3>搜索结果 ({{ searchResults.length }} 文件)</h3>
      
      <!-- 批量操作按钮 -->
      <div class="batch-actions">
        <el-button size="small" @click="expandAllResults" :disabled="loading">
          <i class="el-icon-arrow-down"></i> 展开全部
        </el-button>
        <el-button size="small" @click="collapseAllResults" :disabled="loading">
          <i class="el-icon-arrow-up"></i> 收起全部
        </el-button>
        <span class="match-total" v-if="getTotalMatchCount() > 0">
          共找到 {{ getTotalMatchCount() }} 处匹配
        </span>
      </div>
      
      <el-table :data="sortedSearchResults" style="width: 100%">
        <el-table-column prop="fileName" label="文件名" width="250" sortable>
          <template slot-scope="scope">
            <el-tooltip :content="scope.row.fileName" placement="top" :disabled="scope.row.fileName.length < 30">
              <span>{{ scope.row.fileName }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="relevance" label="相关度" width="100" sortable>
          <template slot-scope="scope">
            <el-tooltip v-if="scope.row.error" :content="`分析错误: ${scope.row.error}`" placement="top">
               <span style="color: #F56C6C;">错误 <i class="el-icon-warning-outline"></i></span>
            </el-tooltip>
            <div v-else>
              <el-progress :percentage="scope.row.relevance" :status="scope.row.relevance > 80 ? 'success' : scope.row.relevance > 50 ? 'warning' : 'exception'"></el-progress>
              <div class="score-tags">
                <el-tag size="mini" type="info" v-if="scope.row.apiSkipped">基于直接匹配</el-tag>
                <el-tag size="mini" type="success" v-else-if="scope.row.useSemanticMatch">语义理解</el-tag>
                <el-tag size="mini" type="warning" v-if="scope.row.apiWarning">API异常</el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="匹配内容" min-width="300">
          <template slot-scope="scope">
            <div v-if="scope.row.relevanceExplanation" class="relevance-explanation">
              {{ scope.row.relevanceExplanation }}
            </div>
            <div v-if="scope.row.matchedLines && scope.row.matchedLines.length > 0">
              <div class="match-summary">
                <span class="match-count">
                  {{ scope.row.matchedLines.length }}处匹配
                  <el-tag size="mini" v-if="scope.row.matchCountExceedsLimit" type="warning">
                    显示前100条（匹配过多）
                  </el-tag>
                </span>
                <el-button 
                  type="text" 
                  @click="toggleMatchDetails(scope.row)" 
                  class="toggle-btn"
                >
                  {{ scope.row.showDetails ? '收起' : '展开' }}
                  <i :class="scope.row.showDetails ? 'el-icon-arrow-up' : 'el-icon-arrow-down'"></i>
                </el-button>
              </div>
              <div v-if="scope.row.showDetails" class="matched-lines">
                <div v-if="scope.row.matchedLines.length > 10" class="match-filter">
                  <el-input
                    v-model="scope.row.filterText"
                    placeholder="在当前匹配中搜索"
                    prefix-icon="el-icon-search"
                    clearable
                    size="small"
                    @input="handleMatchFilter(scope.row)"
                  ></el-input>
                </div>
                <div v-if="scope.row.filteredMatches && scope.row.filteredMatches.length === 0" class="no-filter-matches">
                  没有符合筛选条件的匹配项
                </div>
                <div v-if="(scope.row.filteredMatches || scope.row.matchedLines).length > matchPagination.pageSize" class="pagination-control top">
                  <div class="pagination-info">
                    显示 {{ getPaginatedMatches(scope.row).length }} / {{ (scope.row.filteredMatches || scope.row.matchedLines).length }} 条匹配
                  </div>
                  <el-pagination
                    @current-change="(page) => handlePageChange(page, scope.row.id)"
                    :current-page="matchPagination.currentPageMap[scope.row.id] || 1"
                    :page-size="matchPagination.pageSize"
                    layout="prev, pager, next, jumper"
                    :total="(scope.row.filteredMatches || scope.row.matchedLines).length"
                    small
                  ></el-pagination>
                </div>
                <el-card 
                  v-for="(match, index) in getPaginatedMatches(scope.row)" 
                  :key="index" 
                  class="match-card"
                >
                  <div slot="header" class="match-header">
                    <span class="sheet-name">工作表: {{ match.sheet }}</span>
                    <span class="row-number">行 {{ match.row }}</span>
                  </div>
                  <div class="match-content-wrapper">
                    <div v-html="highlightMatch(match.content, lastSearchedContent)" class="match-content"></div>
                    
                    <!-- 添加一个"查看完整内容"对话框 -->
                    <div class="content-actions">
                      <el-button size="mini" type="text" @click="showFullContent(match)">
                        查看完整内容 <i class="el-icon-view"></i>
                      </el-button>
                    </div>
                  </div>
                  <div class="cell-details" v-if="match.cells && match.cells.length > 0">
                    <div class="cell-details-header">单元格详情:</div>
                    <el-table :data="formatCellsForTable(match.cells)" size="mini" border>
                      <el-table-column prop="column" label="列" width="60"></el-table-column>
                      <el-table-column prop="value" label="值">
                        <template slot-scope="cellScope">
                          <div v-html="highlightMatch(cellScope.row.value, lastSearchedContent)"></div>
                        </template>
                      </el-table-column>
                    </el-table>
                  </div>
                </el-card>
              </div>
            </div>
            <div v-else class="no-matches">
              {{ scope.row.suggestedLocation }}
            </div>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div v-else-if="!loading && searched" class="no-results">
        未找到包含 "{{ lastSearchedContent }}" 相关内容的文件，或所有文件分析出错。
    </div>

    <!-- 添加完整内容对话框 -->
    <el-dialog
      title="完整匹配内容"
      :visible.sync="fullContentDialog.visible"
      width="80%"
      class="full-content-dialog"
    >
      <div class="sheet-info">
        <span class="sheet-name-full">工作表: {{ fullContentDialog.match.sheet }}</span>
        <span class="row-number-full">行: {{ fullContentDialog.match.row }}</span>
      </div>
      <div class="full-content-wrapper">
        <div v-html="highlightMatch(fullContentDialog.match.content, lastSearchedContent)" class="full-content"></div>
      </div>
      <div class="cell-details-full" v-if="fullContentDialog.match.cells && fullContentDialog.match.cells.length > 0">
        <div class="cell-details-header">单元格详情:</div>
        <el-table :data="formatCellsForTable(fullContentDialog.match.cells)" size="mini" border stripe>
          <el-table-column prop="column" label="列" width="80"></el-table-column>
          <el-table-column prop="value" label="值">
            <template slot-scope="cellScope">
              <div v-html="highlightMatch(cellScope.row.value, lastSearchedContent)"></div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import axios from 'axios'

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000'

export default {
  name: 'ExcelContentFinder',
  data() {
    return {
      searchContent: '',
      lastSearchedContent: '',
      selectedFiles: [], // 用户选择的Excel文件
      searchResults: [],
      loading: false,
      serverConnected: false,
      searched: false,
      analysisProgress: { processed: 0, total: 0 },
      showApiConfig: false,
      fileListCollapse: [], // 用于控制文件列表折叠状态，默认收起
      processCollapse: ['process'], // 用于控制处理过程折叠状态，默认展开
      apiConfig: {
        apiUrl: '',
        apiKey: '',
        model: 'DeepSeek-R1',
        maxTokens: 32768
      },
      modelOptions: [
        { value: 'DeepSeek-R1', label: 'DeepSeek-R1' },
        { value: 'DeepSeek-v3', label: 'DeepSeek-v3' },
        { value: 'Qwen3-235B-A22B', label: 'Qwen3-235B-A22B' },
        { value: 'Qwen2.5-72B-Instruct', label: 'Qwen2.5-72B-Instruct' },
        { value: 'Qwen2.5-32B-Instruct', label: 'Qwen2.5-32B-Instruct' },
        { value: 'QwQ-32B', label: 'QwQ-32B' },
        { value: 'Qwen2.5-7B-Instruct', label: 'Qwen2.5-7B-Instruct' },
        { value: 'DeepSeek-R1-Distill-Qwen-32B', label: 'DeepSeek-R1-Distill-Qwen-32B' },
        { value: 'DeepSeek-R1-Distill-Qwen-7B', label: 'DeepSeek-R1-Distill-Qwen-7B' }
      ],
      originalApiConfig: {}, // 用于重置
      saveConfigLoading: false,
      testApiLoading: false,
      showApiKey: false,
      apiErrorMessage: '',
      analysisLogs: [], // 存储分析过程中的日志
      batchSizeLimit: 10, // 默认每次最多处理10个文件
      // 批次处理信息
      batchProcessInfo: {
        enabled: false, // 是否开启批次处理
        totalFiles: 0, // 所有要处理的文件数
        processedFiles: 0, // 已处理的文件数
        currentBatch: 0, // 当前批次
        totalBatches: 0, // 总批次
        percentage: 0, // 进度百分比
        remainingFiles: [], // 剩余的待处理文件
        autoContinue: true, // 是否自动继续处理下一批
      },
      showAdvancedOptions: false,
      searchOptions: {
        understandingMode: 'semantic',
        minRelevanceThreshold: 50,
        analysisDepth: 'shallow'
      },
      matchPagination: {
        pageSize: 20,
        currentPageMap: {} // 存储每个文件结果的当前页码
      },
      fullContentDialog: {
        visible: false,
        match: { 
          content: '',
          cells: [],
          sheet: '',
          row: 0
        }
      }
    }
  },
  computed: {
    // 计算分析进度百分比
    analysisProgressPercentage() {
      if (!this.analysisProgress.total) return 0;
      return Math.round((this.analysisProgress.processed / this.analysisProgress.total) * 100);
    },
    // 排序后的搜索结果
    sortedSearchResults() {
      return [...this.searchResults].sort((a, b) => b.relevance - a.relevance);
    },
    // 文件列表表格数据
    selectedFilesTable() {
      return this.selectedFiles.map(file => ({
        name: file.name,
        size: this.formatFileSize(file.size)
      }));
    },
    // 计算每个文件的匹配内容总数
    matchedContentStats() {
      return this.searchResults.reduce((acc, file) => {
        acc.total += file.matchedLines ? file.matchedLines.length : 0;
        acc.files += file.matchedLines && file.matchedLines.length > 0 ? 1 : 0;
        return acc;
      }, { total: 0, files: 0 });
    }
  },
  created() {
    this.checkServerConnection()
    this.getApiConfig()
    
    // 设置文件列表默认收起
    this.fileListCollapse = []
    
    // 设置分析进度默认展开
    this.processCollapse = ['process']
  },
  methods: {
    // 格式化文件大小
    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    // 检查服务器连接
    async checkServerConnection() {
      this.serverConnected = false;
      try {
        await axios.get(`${API_BASE_URL}/api/health`, { timeout: 3000 });
        this.serverConnected = true
      } catch (error) {
        console.error('服务器连接失败:', error)
        this.serverConnected = false
        this.$message.error('无法连接到后台服务，请确保服务已启动并检查网络。')
      }
    },
    
    // 处理文件夹选择
    handleFolderSelection(event) {
      const files = event.target.files;
      if (!files || files.length === 0) return;
      
      // 清空之前选择的文件
      this.selectedFiles = [];
      
      // 过滤出Excel文件
      Array.from(files).forEach(file => {
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          this.selectedFiles.push(file);
        }
      });
      
      if (this.selectedFiles.length === 0) {
        this.$message.warning('所选文件夹中未发现Excel文件');
      } else {
        this.$message.success(`已选择 ${this.selectedFiles.length} 个Excel文件`);
      }
    },
    
    // 处理匹配内容的筛选
    handleMatchFilter(file) {
      if (!file.filterText || file.filterText.trim() === '') {
        file.filteredMatches = null; // 清空筛选，显示所有匹配
        return;
      }
      
      const filterText = file.filterText.toLowerCase();
      file.filteredMatches = file.matchedLines.filter(match => 
        match.content.toLowerCase().includes(filterText)
      );
    },
    
    // 获取当前文件的分页结果
    getPaginatedMatches(file) {
      // 处理可能为null或未定义的情况
      if (!file || !file.matchedLines) {
        return [];
      }
      
      // 如果有筛选内容，优先返回筛选结果
      if (file.filteredMatches) {
        return this.paginateArray(file.filteredMatches, file.id);
      }
      
      // 否则返回分页后的原始匹配结果
      return this.paginateArray(file.matchedLines, file.id);
    },
    
    // 数组分页处理
    paginateArray(array, fileId) {
      if (!array || array.length === 0) return [];
      
      // 确保文件ID存在，用于唯一标识当前文件的分页状态
      if (!fileId) {
        fileId = array.toString().slice(0, 10);
      }
      
      // 初始化当前页码
      if (!this.matchPagination.currentPageMap[fileId]) {
        this.$set(this.matchPagination.currentPageMap, fileId, 1);
      }
      
      const currentPage = this.matchPagination.currentPageMap[fileId];
      const pageSize = this.matchPagination.pageSize;
      
      // 计算起始和结束索引
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = currentPage * pageSize;
      
      // 返回当前页的数据
      return array.slice(startIndex, endIndex);
    },
    
    // 切换分页
    handlePageChange(currentPage, fileId) {
      this.$set(this.matchPagination.currentPageMap, fileId, currentPage);
    },
    
    // 切换匹配详情的显示状态
    toggleMatchDetails(file) {
      // 使用Vue.set确保响应式更新
      this.$set(file, 'showDetails', !file.showDetails);
      
      // 初始化筛选和分页状态
      if (file.showDetails) {
        if (!file.hasOwnProperty('filterText')) {
          this.$set(file, 'filterText', '');
          this.$set(file, 'filteredMatches', null);
        }
        
        // 重置分页
        if (!file.id) {
          // 生成唯一ID
          file.id = file.fileName.replace(/\W/g, '') + Date.now().toString().slice(-6);
        }
        this.$set(this.matchPagination.currentPageMap, file.id, 1);
      }
    },
    
    // 开始批量分析处理
    startBatchAnalysis() {
      if (!this.serverConnected) {
        this.$message.error('服务器未连接，请先确保后台服务运行正常');
        this.checkServerConnection();
        return;
      }
      
      if (!this.searchContent) {
        this.$message.warning('请输入搜索内容');
        return;
      }
      
      if (this.selectedFiles.length === 0) {
        this.$message.warning('请先选择包含Excel文件的文件夹');
        return;
      }
      
      if (this.loading) {
        this.$message.warning('正在分析中，请稍候...');
        return;
      }

      // 重置状态
      this.searchResults = [];
      this.lastSearchedContent = this.searchContent;
      
      // 初始化批处理信息
      this.batchProcessInfo.enabled = true;
      this.batchProcessInfo.totalFiles = this.selectedFiles.length;
      this.batchProcessInfo.processedFiles = 0;
      this.batchProcessInfo.currentBatch = 1;
      
      // 计算总批次数
      if (this.batchSizeLimit > 0) {
        this.batchProcessInfo.totalBatches = Math.ceil(this.selectedFiles.length / this.batchSizeLimit);
      } else {
        this.batchProcessInfo.totalBatches = 1;
      }
      
      this.batchProcessInfo.percentage = 0;
      this.batchProcessInfo.remainingFiles = [...this.selectedFiles];
      this.batchProcessInfo.autoContinue = true;
      
      // 清空之前的日志
      this.analysisLogs = [];
      this.addAnalysisLog(`开始批量处理，共 ${this.selectedFiles.length} 个文件，分为 ${this.batchProcessInfo.totalBatches} 个批次`, 'info');
      
      // 处理第一批
      this.processBatch();
    },
    
    // 处理单个批次
    async processBatch() {
      this.loading = true;
      this.searched = true;
      
      // 确定本批次要处理的文件
      let filesToProcess = [];
      if (this.batchSizeLimit > 0) {
        filesToProcess = this.batchProcessInfo.remainingFiles.slice(0, this.batchSizeLimit);
        this.batchProcessInfo.remainingFiles = this.batchProcessInfo.remainingFiles.slice(this.batchSizeLimit);
      } else {
        filesToProcess = [...this.batchProcessInfo.remainingFiles];
        this.batchProcessInfo.remainingFiles = [];
      }
      
      this.analysisProgress = { processed: 0, total: filesToProcess.length };
      this.addAnalysisLog(`处理批次 ${this.batchProcessInfo.currentBatch}/${this.batchProcessInfo.totalBatches}，本批次 ${filesToProcess.length} 个文件`, 'info');
      
      // 创建FormData并添加搜索内容
      const formData = new FormData();
      formData.append('searchContent', this.searchContent);
      
      // 添加高级搜索选项
      formData.append('understandingMode', this.searchOptions.understandingMode);
      formData.append('minRelevanceThreshold', this.searchOptions.minRelevanceThreshold.toString());
      formData.append('analysisDepth', this.searchOptions.analysisDepth);
      
      // 添加本批次的所有Excel文件
      filesToProcess.forEach(file => {
        formData.append('files', file);
        this.addAnalysisLog(`添加文件: ${file.name}`, 'info');
      });
      
      try {
        this.addAnalysisLog(`开始上传文件...分析模式: ${this.searchOptions.understandingMode}`, 'info');
        const response = await axios.post(
          `${API_BASE_URL}/api/upload-and-analyze`, 
          formData,
          {
          headers: {
              // 不需要手动设置Content-Type，浏览器会自动处理FormData
            },
            timeout: 300000, // 5分钟超时
            onUploadProgress: (progressEvent) => {
              // 如果需要显示上传进度
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              console.log(`上传进度: ${percentCompleted}%`);
              if (percentCompleted === 100) {
                this.addAnalysisLog('文件上传完成，开始分析...', 'info');
              }
            }
          }
        );

        if (response.data.error) {
          throw new Error(response.data.error);
        } else if (response.data.results) {
          // 记录分析结果
          this.addAnalysisLog(`批次 ${this.batchProcessInfo.currentBatch} 分析完成，找到 ${response.data.results.length} 个结果文件`, 'success');
          
          // 初始化结果中的展开/折叠状态，并合并到总结果中
          const batchResults = response.data.results.map(result => {
            if (result.matchedLines && result.matchedLines.length > 0) {
              this.addAnalysisLog(`文件 "${result.fileName}" 找到 ${result.matchedLines.length} 处匹配，相关度: ${result.relevance}`, 'success');
            }
            return {
              ...result,
              showDetails: false,
              filterText: '',
              filteredMatches: null
            };
          });
          
          // 合并结果
          this.searchResults = [...this.searchResults, ...batchResults];
        } else {
          console.warn("意外的响应结构:", response.data);
          this.addAnalysisLog('收到未预期的服务器响应格式', 'error');
        }
        
        // 更新批处理进度信息
        this.batchProcessInfo.processedFiles += filesToProcess.length;
        this.batchProcessInfo.percentage = Math.floor((this.batchProcessInfo.processedFiles / this.batchProcessInfo.totalFiles) * 100);
        
        // 检查是否还有剩余批次
        if (this.batchProcessInfo.remainingFiles.length > 0) {
          this.batchProcessInfo.currentBatch++;
          this.addAnalysisLog(`批次 ${this.batchProcessInfo.currentBatch - 1}/${this.batchProcessInfo.totalBatches} 处理完成，剩余 ${this.batchProcessInfo.remainingFiles.length} 个文件待处理`, 'success');
          
          // 是否自动处理下一批
          if (this.batchProcessInfo.autoContinue) {
            // 给用户一些时间查看结果，然后再继续处理下一批
            setTimeout(() => {
              this.processBatch();
            }, 1000);
          } else {
            this.loading = false;
            this.addAnalysisLog('等待用户手动继续下一批处理', 'info');
          }
        } else {
          // 所有批次已处理完成
          this.addAnalysisLog(`所有 ${this.batchProcessInfo.totalBatches} 个批次处理完成，共分析 ${this.batchProcessInfo.processedFiles} 个文件`, 'success');
          this.loading = false;
        }
        
      } catch (error) {
        console.error('分析过程中发生错误:', error);
        let errorMessage = '分析过程中发生错误';
        
        if (error.code === 'ECONNABORTED') {
          errorMessage = '请求超时，分析过程可能需要较长时间，请减少文件数量后再试。';
          this.addAnalysisLog('请求超时，请减少文件数量后重试', 'error');
          // 自动减少批次大小并重试
          if (this.batchSizeLimit > 5) {
            const newBatchSize = Math.max(5, Math.floor(this.batchSizeLimit / 2));
            this.addAnalysisLog(`自动减少批次大小至 ${newBatchSize} 并重试`, 'warning');
            this.batchSizeLimit = newBatchSize;
            // 将当前批次的文件重新放回待处理队列
            this.batchProcessInfo.remainingFiles = [...filesToProcess, ...this.batchProcessInfo.remainingFiles];
            setTimeout(() => {
              this.loading = false;
              this.processBatch();
            }, 2000);
            return;
          }
        } else if (error.response) {
          errorMessage = error.response.data?.error || `服务器错误 (${error.response.status})`;
          this.addAnalysisLog(`服务器返回错误: ${errorMessage}`, 'error');
          
          // 检测API错误并提供配置入口
          if (error.response.status === 401) {
            this.apiErrorMessage = '认证失败 (401): API密钥可能无效或已过期';
            this.addAnalysisLog('API认证失败，请检查API配置', 'error');
            this.$confirm('API认证失败，是否打开API配置页面进行设置？', '认证错误', {
              confirmButtonText: '去设置',
              cancelButtonText: '取消',
              type: 'warning'
            }).then(() => {
              this.showApiConfig = true;
            }).catch(() => {});
          }
        } else if (error.request) {
          errorMessage = '无法从服务器获取响应，请检查网络和服务状态。';
          this.addAnalysisLog('无法获取服务器响应，请检查网络连接', 'error');
        } else {
          errorMessage = error.message || errorMessage;
          this.addAnalysisLog(`错误: ${errorMessage}`, 'error');
        }
        
        this.$message.error(errorMessage);
        this.loading = false;
        // 停止自动批处理，等待用户手动继续
        this.batchProcessInfo.autoContinue = false;
      }
    },
    
    // 手动继续处理下一批
    continueNextBatch() {
      if (this.loading) {
        this.$message.warning('正在分析中，请稍候...');
        return;
      }
      
      if (this.batchProcessInfo.remainingFiles.length === 0) {
        this.$message.info('所有文件已处理完成');
        return;
      }
      
      this.addAnalysisLog('手动继续处理下一批', 'info');
      this.processBatch();
    },
    
    // 上传并分析文件 (保留以兼容可能的外部调用)
    async handleUploadAndAnalyze() {
      this.startBatchAnalysis();
    },
    
    // 高亮匹配的内容
    highlightMatch(text, searchTerm) {
      if (!text || !searchTerm) return text;
      
      // 转义正则表达式中的特殊字符
      const escapeRegExp = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      };
      
      // 不区分大小写匹配
      const regex = new RegExp(escapeRegExp(searchTerm), 'gi');
      
      // 替换为高亮样式，并添加独特的标记以便更容易找到
      const highlighted = text.replace(regex, match => 
        `<span class="highlight" data-match="${this.lastSearchedContent}">${match}</span>`);
      
      return highlighted;
    },
    
    // 将单元格数组格式化为表格数据
    formatCellsForTable(cells) {
      return cells.map((value, index) => ({
        column: this.getColumnLetter(index),
        value: value !== undefined && value !== null ? String(value) : ''
      }));
    },
    
    // 将列索引转换为Excel列字母（A, B, C...AA, AB...）
    getColumnLetter(index) {
      let column = '';
      let temp = index;
      
      while (temp >= 0) {
        column = String.fromCharCode(65 + (temp % 26)) + column;
        temp = Math.floor(temp / 26) - 1;
      }
      
      return column;
    },
    // 获取总匹配数
    getTotalMatchCount() {
      return this.searchResults.reduce((total, file) => {
        return total + (file.matchedLines ? file.matchedLines.length : 0);
      }, 0);
    },
    
    // 展开所有结果
    expandAllResults() {
      if (this.searchResults && this.searchResults.length > 0) {
        this.searchResults.forEach(file => {
          if (file && file.matchedLines && file.matchedLines.length > 0) {
            this.$set(file, 'showDetails', true);
            // 确保初始化筛选
            if (!file.hasOwnProperty('filterText')) {
              this.$set(file, 'filterText', '');
              this.$set(file, 'filteredMatches', null);
            }
          }
        });
      }
    },
    
    // 收起所有结果
    collapseAllResults() {
      if (this.searchResults && this.searchResults.length > 0) {
        this.searchResults.forEach(file => {
          if (file) {
            this.$set(file, 'showDetails', false);
          }
        });
      }
    },

    // 获取API配置
    async getApiConfig() {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/config`);
        if (response.data && response.data.config) {
          this.apiConfig.apiUrl = response.data.config.SOPHNET_API_URL || '';
          this.apiConfig.apiKey = response.data.config.SOPHNET_API_KEY || '';
          this.apiConfig.model = response.data.config.SOPHNET_MODEL || 'DeepSeek-R1';
          this.apiConfig.maxTokens = response.data.config.SOPHNET_MAX_TOKENS || 32768;
          // 清除错误信息
          this.apiErrorMessage = '';
        }
      } catch (error) {
        console.error('获取API配置失败:', error);
        this.$message.error('获取API配置失败，请检查服务器连接');
      }
    },

    // 保存API配置
    async saveApiConfig() {
      this.saveConfigLoading = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/api/config`, {
          SOPHNET_API_URL: this.apiConfig.apiUrl,
          SOPHNET_API_KEY: this.apiConfig.apiKey,
          SOPHNET_MODEL: this.apiConfig.model,
          SOPHNET_MAX_TOKENS: this.apiConfig.maxTokens
        });
        
        if (response.data && response.data.success) {
          this.$message.success('API配置保存成功');
          this.showApiConfig = false;
          // 重新检查服务器连接
          this.checkServerConnection();
        } else {
          this.$message.error('保存失败: ' + (response.data.error || '未知错误'));
        }
      } catch (error) {
        console.error('保存API配置失败:', error);
        this.$message.error('保存API配置失败: ' + (error.response?.data?.error || error.message || '未知错误'));
      } finally {
        this.saveConfigLoading = false;
      }
    },

    // 测试API连接
    async testApiConnection() {
      this.testApiLoading = true;
      try {
        const response = await axios.post(`${API_BASE_URL}/api/test-connection`, {
          SOPHNET_API_URL: this.apiConfig.apiUrl,
          SOPHNET_API_KEY: this.apiConfig.apiKey,
          SOPHNET_MODEL: this.apiConfig.model
        });
        
        if (response.data && response.data.success) {
          this.$message.success('API连接测试成功!');
        } else {
          this.$message.error('API连接测试失败: ' + (response.data.error || '未知错误'));
        }
      } catch (error) {
        console.error('API连接测试失败:', error);
        this.$message.error('API连接测试失败: ' + (error.response?.data?.error || error.message || '未知错误'));
      } finally {
        this.testApiLoading = false;
      }
    },

    // 对话框打开时的处理
    onConfigDialogOpen() {
      // 备份原始配置用于重置
      this.originalApiConfig = { ...this.apiConfig };
      // 默认隐藏API密钥
      this.showApiKey = false;
    },

    // 重置API配置
    resetApiConfig() {
      this.apiConfig = { ...this.originalApiConfig };
    },

    // 添加分析日志
    addAnalysisLog(message, type = 'info') {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      this.analysisLogs.push({
        time: timeStr,
        message,
        type
      });
    },
    
    // 清除分析日志
    clearAnalysisLogs() {
      this.analysisLogs = [];
    },

    // 显示完整匹配内容
    showFullContent(match) {
      this.fullContentDialog.match = match;
      this.fullContentDialog.visible = true;
    },
  },
  beforeDestroy() {
    // 这个钩子中不再需要关闭EventSource，因为我们已经不使用SSE了
  }
}
</script>

<style scoped>
.excel-content-finder {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

.server-status-container {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.server-status {
  flex: 1;
  padding: 10px;
  background-color: #f56c6c;
  color: white;
  border-radius: 4px;
  text-align: center;
  transition: background-color 0.3s ease;
}

.server-status.connected {
  background-color: #67c23a;
}

.analysis-method-info {
  margin-bottom: 20px;
  border: 1px solid #e6e6e6;
  border-radius: 4px;
  overflow: hidden;
}

.folder-selection-section {
  margin-bottom: 15px;
  display: flex;
  align-items: center;
  gap: 15px;
}

.selected-files-info {
  color: #409EFF;
  font-weight: bold;
}

.search-section {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.search-input {
  flex: 1;
}

.file-list-section {
  margin-bottom: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}

.status-section {
  margin: 20px 0;
  padding: 0;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background-color: #fff;
}

.status-section p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.results-section {
  margin-top: 20px;
}

.no-results {
  text-align: center;
  color: #909399;
  margin-top: 30px;
  padding: 20px;
  border: 1px dashed #dcdfe6;
  border-radius: 4px;
}

:deep(.el-table .el-progress__text) {
  font-size: 12px !important;
}
:deep(.el-table .el-progress-bar) {
  padding-right: 50px;
  margin-right: -50px;
}

.small-text {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}

.match-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.match-count {
  font-weight: bold;
  color: #409EFF;
}

.toggle-btn {
  padding: 0;
}

.matched-lines {
  margin-top: 10px;
}

.match-card {
  margin-bottom: 16px;
  max-width: 100%;
  overflow: hidden;
  border: 1px solid #dcdfe6;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.match-card :deep(.el-card__header) {
  padding: 12px 15px;
  background-color: #f6f8fa;
  font-size: 13px;
}

.match-card :deep(.el-card__body) {
  padding: 15px;
}

.match-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.sheet-name {
  font-weight: bold;
  color: #409EFF;
}

.row-number {
  color: #606266;
  font-weight: normal;
}

/* 单元格详情表格样式 */
.cell-details {
  margin-top: 15px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.cell-details-header {
  font-weight: bold;
  margin-bottom: 8px;
  font-size: 13px;
  color: #303133;
}

.cell-details .el-table {
  margin-top: 8px;
  border-radius: 4px;
  overflow: hidden;
  max-height: none;
}

.cell-details .el-table :deep(th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 8px 12px;
}

.cell-details .el-table :deep(td) {
  padding: 8px 12px;
}

/* 确保单元格内容完整显示 */
.cell-details .el-table :deep(.cell) {
  word-break: break-word;
  line-height: 1.5;
  min-height: 20px;
}

.batch-actions {
  display: flex;
  margin-bottom: 15px;
  align-items: center;
  gap: 10px;
}

.match-total {
  margin-left: auto;
  font-weight: bold;
  color: #409EFF;
}

.match-filter {
  margin-bottom: 10px;
}

.no-filter-matches {
  text-align: center;
  color: #909399;
  padding: 10px;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 4px;
  margin-bottom: 10px;
}

.error-details {
  font-family: monospace;
  margin-top: 8px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.api-config-button {
  position: absolute;
  right: -15px;
  top: 50%;
  transform: translateY(-50%);
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  z-index: 1;
}

.form-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.2;
  padding: 2px 0;
}

.analysis-logs {
  margin-top: 10px;
}

.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 8px;
  background-color: #FAFAFA;
}

.log-item {
  margin-bottom: 5px;
  padding: 4px 0;
  border-bottom: 1px dashed #EBEEF5;
}

.log-time {
  font-size: 12px;
  color: #909399;
  margin-right: 8px;
  display: inline-block;
  width: 80px;
}

.log-message {
  font-size: 12px;
  color: #606266;
}

.log-error {
  color: #F56C6C;
}

.log-error .log-time {
  color: #F56C6C;
  opacity: 0.8;
}

.log-success {
  color: #67C23A;
}

.log-success .log-time {
  color: #67C23A;
  opacity: 0.8;
}

.api-skipped-tag {
  margin-top: 2px;
  text-align: center;
}

.api-skipped-tag .el-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 14px;
}

.batch-process-info {
  margin: 20px 0;
}

.batch-process-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
  font-size: 12px;
}

.relevance-explanation {
  margin-bottom: 10px;
  font-style: italic;
  color: #909399;
}

.api-warning-tag {
  margin-top: 2px;
  text-align: center;
}

.api-warning-tag .el-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 14px;
}

.score-tags {
  margin-top: 2px;
  text-align: center;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.score-tags .el-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 14px;
}

.advanced-options {
  margin-top: 10px;
}

.pagination-control {
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  background-color: #f8f8f8;
  padding: 8px;
  border-radius: 4px;
}

.pagination-control.top {
  margin-bottom: 15px;
}

.pagination-control.bottom {
  margin-top: 15px;
}

.pagination-info {
  font-size: 12px;
  color: #606266;
  padding: 0 10px;
}

.el-pagination {
  padding: 0;
  margin: 0;
}

.match-content-wrapper {
  margin-bottom: 15px;
  border-radius: 4px;
  overflow: hidden;
}

.match-content {
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', monospace;
  font-size: 13px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  line-height: 1.6;
  border: 1px solid #e0e0e0;
  color: #303133;
  min-height: 40px;
  position: relative;
  overflow: visible; /* 允许内容溢出显示，不截断 */
}

.no-matches {
  color: #909399;
  font-style: italic;
  padding: 10px;
  text-align: center;
  background-color: #f9f9f9;
  border-radius: 4px;
}

:deep(.highlight) {
  background-color: #ffef40;
  padding: 2px 4px;
  border-radius: 2px;
  font-weight: bold;
  color: #d32f2f;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
  position: relative;
  display: inline-block;
  z-index: 2;
}

.content-actions {
  margin-top: 10px;
  text-align: right;
}

.full-content-wrapper {
  padding: 15px;
  background-color: #f8f8f8;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  margin-bottom: 15px;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  max-height: 400px;
  overflow-y: auto;
}

.sheet-info {
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}

.sheet-name-full {
  font-weight: bold;
  color: #409EFF;
  font-size: 14px;
}

.row-number-full {
  color: #606266;
}

.cell-details-full {
  margin-top: 20px;
}

:deep(.full-content-dialog .el-dialog__body) {
  padding: 20px;
}
</style> 